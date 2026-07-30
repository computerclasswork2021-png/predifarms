import {
  LayoutDashboard,
  Sprout,
  FlaskConical,
  ScanLine,
  CloudSun,
  TrendingUp,
  SlidersHorizontal,
  MessagesSquare,
  FileBarChart2,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  short: string;
  to: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Today",
    items: [
      {
        label: "Action Plan",
        short: "Today",
        to: "/dashboard",
        icon: LayoutDashboard,
        description: "What needs doing right now",
      },
      {
        label: "My Fields",
        short: "Fields",
        to: "/fields",
        icon: Sprout,
        description: "Every block, stage by stage",
      },
    ],
  },
  {
    title: "Diagnose",
    items: [
      {
        label: "Soil",
        short: "Soil",
        to: "/soil",
        icon: FlaskConical,
        description: "NPK, pH and moisture per block",
      },
      {
        label: "Leaf Scan",
        short: "Scan",
        to: "/disease",
        icon: ScanLine,
        description: "Photograph a leaf, get a diagnosis",
      },
      {
        label: "Weather",
        short: "Weather",
        to: "/weather",
        icon: CloudSun,
        description: "7 days, read as field operations",
      },
    ],
  },
  {
    title: "Decide",
    items: [
      {
        label: "Crop Planner",
        short: "Plan",
        to: "/crops",
        icon: Sprout,
        description: "Only for land that is free",
      },
      {
        label: "Mandi Prices",
        short: "Mandi",
        to: "/mandi",
        icon: TrendingUp,
        description: "Rates, MSP and selling windows",
      },
      {
        label: "What-if",
        short: "What-if",
        to: "/simulator",
        icon: SlidersHorizontal,
        description: "Model a decision before you make it",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "Ask PREDI",
        short: "Ask",
        to: "/assistant",
        icon: MessagesSquare,
        description: "Answers grounded in your own farm data",
      },
      {
        label: "Records",
        short: "Records",
        to: "/reports",
        icon: FileBarChart2,
        description: "Season log and exports",
      },
      {
        label: "Settings",
        short: "Settings",
        to: "/settings",
        icon: Settings2,
        description: "Language, units and alerts",
      },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

/** Bottom bar on phones — the four things a farmer opens daily. */
export const MOBILE_NAV = [
  ALL_NAV[0],
  ALL_NAV[1],
  ALL_NAV[3],
  ALL_NAV[4],
  ALL_NAV[8],
];
