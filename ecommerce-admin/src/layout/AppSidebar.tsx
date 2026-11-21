"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { getUser } from "@/actions/auth/getUser";
import { getSystemMenus } from "@/actions/system-menus/system-menus";
import { getSystemMenuSections } from "@/actions/system-menu-sections/system-menu-sections";
import { getUserMenuPermissions } from "@/actions/user-menu-permission/user-menu-permission";
import { getUserSectionPermissions } from "@/actions/user-section-permission/user-section-permission";
import {
  ChevronDownIcon,
  GridIcon,
  PageIcon,
  UserCircleIcon
} from "../icons/index";
import { ShoppingCart, CirclePile, Users, ShoppingBag } from 'lucide-react';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// NOTE: for items without subItems, `name` must match the section name in the
// database (case-insensitive) so section permissions can show them.
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/" },
  {
    icon: <UserCircleIcon />,
    name: "Administration",
    subItems: [
      { name: "System Logs", path: "/system-logs", pro: false },
      { name: "System Users", path: "/system-users", pro: false },
    ],
  },
  {
    name: "Master Data",
    icon: <PageIcon />,
    subItems: [
      { name: "Sizes", path: "/sizes", pro: false },
      { name: "Categories", path: "/categories", pro: false },
      { name: "Brands", path: "/brands", pro: false },
    ],
  },
  { name: "Product", 
    icon: <ShoppingCart />, 
    subItems: [
      { name: "Products", path: "/products", pro: false},
      { name: "Product Variant", path: "/product-variants", pro: false},
      { name: "Top Sellers", path: "/top-sellers", pro: false}
    ]
  },
  { name: "Inventory", 
    icon: <CirclePile />, 
    subItems: [
      { name: "Inventory", path: "/inventory", pro: false},
      { name: "Stock Moves", path: "/stock-moves", pro: false},
    ]
  },
  { name: "Order", 
    icon: <ShoppingBag  />, 
    subItems: [
      { name: "Orders", path: "/orders", pro: false},
    ]
  },
  { name: "Customer", 
    icon: <Users />, 
    subItems: [
      { name: "Customers", path: "/customer", pro: false},
    ]
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

type Access = {
  // menu paths the user can view
  paths: Set<string>;
  // names (normalized) of sections the user has been given
  sections: Set<string>;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // null = still loading, show nothing gated yet
  const [access, setAccess] = useState<Access | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const currentUser = await getUser();
        if (!currentUser) {
          setAccess({ paths: new Set(), sections: new Set() });
          return;
        }

        const [menus, sections, userMenuPermissions, userSectionPermissions] =
          await Promise.all([
            getSystemMenus(),
            getSystemMenuSections(),
            getUserMenuPermissions(currentUser.id),
            getUserSectionPermissions(currentUser.id),
          ]);

        const allowedMenuIds = new Set(
          userMenuPermissions.filter((p) => p.canView).map((p) => p.menuId)
        );
        const paths = new Set(
          menus.filter((m) => allowedMenuIds.has(m.id)).map((m) => m.path)
        );

        const enabledSectionIds = new Set(
          userSectionPermissions.filter((p) => p.isEnabled).map((p) => p.sectionId)
        );
        const sectionNames = new Set(
          sections
            .filter((s) => enabledSectionIds.has(s.id))
            .map((s) => normalize(s.name))
        );

        console.log("allowed paths:", [...paths]);
console.log("all menu paths:", menus.map((m) => m.path));
console.log("menu perms:", userMenuPermissions);

        setAccess({ paths, sections: sectionNames });
      } catch (err) {
        console.error("Failed to load sidebar permissions:", err);
        setAccess({ paths: new Set(), sections: new Set() });
      }
    };

    void loadPermissions();
  }, []);

  const visibleNavItems: NavItem[] = React.useMemo(() => {
    if (access === null) return [];

    return navItems.reduce<NavItem[]>((acc, nav) => {
      // Items with sub menus: shown when at least one sub menu is viewable
      if (nav.subItems) {
        const visibleSubItems = nav.subItems.filter((sub) =>
          access.paths.has(sub.path)
        );
        if (visibleSubItems.length > 0) {
          acc.push({ ...nav, subItems: visibleSubItems });
        }
        return acc;
      }

      // Top-level links (no menus): shown when the path is viewable
      // OR the section itself has been given to the user
      const allowedByPath = !!nav.path && access.paths.has(nav.path);
      const allowedBySection = access.sections.has(normalize(nav.name));

      if (allowedByPath || allowedBySection) {
        acc.push(nav);
      }
      return acc;
    }, []);
  }, [access]);

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
  onClick={() => handleSubmenuToggle(index)}
  className={`menu-item group w-full items-center ${
    openSubmenu?.index === index
      ? "menu-item-active"
      : "menu-item-inactive"
  } cursor-pointer ${
    !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
  }`}
>
  <span
    className={`flex items-center justify-center ${
      openSubmenu?.index === index
        ? "menu-item-icon-active"
        : "menu-item-icon-inactive"
    }`}
  >
    {nav.icon}
  </span>
  {(isExpanded || isHovered || isMobileOpen) && (
    <span className="menu-item-text">{nav.name}</span>
  )}
  {(isExpanded || isHovered || isMobileOpen) && (
    <span className="ml-auto flex items-center">
      <ChevronDownIcon
        className={`transition-transform duration-200 ${
          openSubmenu?.index === index ? "rotate-180" : ""
        }`}
      />
    </span>
  )}
</button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{ index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    visibleNavItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      // setOpenSubmenu(null);
    }
  }, [pathname, isActive, visibleNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.index === index) return null;
      return { index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`} />
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>{renderMenuItems(visibleNavItems)}</div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;