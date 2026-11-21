import bcrypt from "bcryptjs";
import { Status } from "@/generated/prisma/enums";
import { prisma } from "@lib/prisma";

const DUMMY_PASSWORD = "Password123!";

type Access = { canView: boolean; canAdd: boolean; canEdit: boolean };

const NONE: Access = { canView: false, canAdd: false, canEdit: false };
const VIEW: Access = { canView: true, canAdd: false, canEdit: false };
const FULL: Access = { canView: true, canAdd: true, canEdit: true };

type DummyUser = {
  name: string;
  email: string;
  status: Status;
  defaultAccess: Access;
  overrides?: Record<string, Access>;
};

const dummyUsers: DummyUser[] = [
  {
    name: "Admin User",
    email: "admin@example.com",
    status: Status.Active,
    defaultAccess: FULL,
  },
  {
    name: "Store Manager",
    email: "manager@example.com",
    status: Status.Active,
    defaultAccess: FULL,
    overrides: {
      "/system-logs": NONE,
      "/system-users": NONE,
    },
  },
  {
    name: "Warehouse Staff",
    email: "warehouse@example.com",
    status: Status.Active,
    defaultAccess: NONE,
    overrides: {
      "/inventory": FULL,
      "/products": FULL,
      "/product-variants": FULL,
      "/sizes": VIEW,
      "/categories": VIEW,
      "/brands": VIEW,
    },
  },
  {
    name: "Sales Staff",
    email: "sales@example.com",
    status: Status.Active,
    defaultAccess: NONE,
    overrides: {
      "/order": FULL,
      "/customer": FULL,
      "/products": VIEW,
      "/product-variants": VIEW,
    },
  },
  {
    name: "Read Only User",
    email: "viewer@example.com",
    status: Status.Active,
    defaultAccess: VIEW,
    overrides: {
      "/system-logs": NONE,
      "/system-users": NONE,
    },
  },
  {
    name: "Inactive User",
    email: "inactive@example.com",
    status: Status.Deactivated,
    defaultAccess: NONE,
  },
];

async function main() {
  const menuSections = [
    { name: "Dashboard", status: Status.Active },
    { name: "Administration", status: Status.Active },
    { name: "Master Data", status: Status.Active },
    { name: "Product", status: Status.Active },
    { name: "Inventory", status: Status.Active },
    { name: "Order", status: Status.Active },
    { name: "Customer", status: Status.Active },
  ];

  const menus = [
    { name: "System Logs", path: "/system-logs", section: "Administration", status: Status.Active },
    { name: "System Users", path: "/system-users", section: "Administration", status: Status.Active },
    { name: "Sizes", path: "/sizes", section: "Master Data", status: Status.Active },
    { name: "Categories", path: "/categories", section: "Master Data", status: Status.Active },
    { name: "Brands", path: "/brands", section: "Master Data", status: Status.Active },
    { name: "Product", path: "/products", section: "Product", status: Status.Active },
    { name: "Product Variants", path: "/product-variants", section: "Product", status: Status.Active },
    { name: "Top Sellers", path: "/top-sellers", section: "Product", status: Status.Active },
    { name: "Inventory", path: "/inventory", section: "Inventory", status: Status.Active },
    { name: "Stock Moves", path: "/stock-moves", section: "Inventory", status: Status.Active},
    { name: "Order", path: "/order", section: "Order", status: Status.Active },
    { name: "Customer", path: "/customer", section: "Customer", status: Status.Active },
  ];

  // 1. Seed menu sections
  for (const section of menuSections) {
    const existing = await prisma.systemMenuSection.findFirst({
      where: { name: section.name },
    });

    if (!existing) {
      await prisma.systemMenuSection.create({ data: section });
      console.log(`✅ Created section: ${section.name}`);
    } else {
      console.log(`⚡ Section already exists, skipping: ${section.name}`);
    }
  }

  // 2. Seed menus (linked to their sections)
  for (const menu of menus) {
    const section = await prisma.systemMenuSection.findFirst({
      where: { name: menu.section },
    });

    if (!section) {
      console.warn(`⚠️ Section "${menu.section}" not found, skipping menu: ${menu.name}`);
      continue;
    }

    const existingMenu = await prisma.systemMenu.findFirst({
      where: { name: menu.name, sectionId: section.id },
    });

    if (!existingMenu) {
      await prisma.systemMenu.create({
        data: {
          name: menu.name,
          path: menu.path,
          status: menu.status,
          sectionId: section.id,
        },
      });
      console.log(`✅ Created menu: ${menu.name} (${menu.section})`);
    } else {
      console.log(`⚡ Menu already exists, skipping: ${menu.name}`);
    }
  }

  // 3. Seed dummy users + permissions
  const allSections = await prisma.systemMenuSection.findMany();
  const allMenus = await prisma.systemMenu.findMany();
  const hashedPassword = await bcrypt.hash(DUMMY_PASSWORD, 10);

  for (const u of dummyUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, status: u.status },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        status: u.status,
      },
    });
    console.log(`👤 User ready: ${user.email} (id ${user.id})`);

    // Menu permissions: one row per menu
    const accessByMenuId = new Map<number, Access>();

    for (const menu of allMenus) {
      const access = u.overrides?.[menu.path] ?? u.defaultAccess;
      accessByMenuId.set(menu.id, access);

      const existing = await prisma.systemMenuPermission.findFirst({
        where: { userId: user.id, menuId: menu.id },
      });

      if (existing) {
        await prisma.systemMenuPermission.update({
          where: { id: existing.id },
          data: access,
        });
      } else {
        await prisma.systemMenuPermission.create({
          data: { userId: user.id, menuId: menu.id, ...access },
        });
      }
    }

    // Section permissions: enabled if the user can view at least one menu in it.
    // Sections with no menus (e.g. Dashboard) are enabled if the user can view anything.
    const canViewAnything = [...accessByMenuId.values()].some((a) => a.canView);

    for (const section of allSections) {
      const sectionMenus = allMenus.filter((m) => m.sectionId === section.id);
      const isEnabled =
        sectionMenus.length === 0
          ? canViewAnything
          : sectionMenus.some((m) => accessByMenuId.get(m.id)?.canView);

      const existing = await prisma.systemMenuSectionPermission.findFirst({
        where: { userId: user.id, sectionId: section.id },
      });

      if (existing) {
        await prisma.systemMenuSectionPermission.update({
          where: { id: existing.id },
          data: { isEnabled },
        });
      } else {
        await prisma.systemMenuSectionPermission.create({
          data: { userId: user.id, sectionId: section.id, isEnabled },
        });
      }
    }

    console.log(`🔐 Permissions set for: ${user.email}`);
  }

  console.log(`\nDummy user password for all accounts: ${DUMMY_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });