import { useState } from "react";
import { AnimatedPage } from "@/components/ui-elements";
import { Trophy, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyticsTab } from "@/components/recruiter/analytics-tab";
import { CustomTestsTab } from "@/components/recruiter/custom-tests-tab";

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  const TABS = [
    { id: "analytics", label: "Analytics", icon: <Trophy className="w-4 h-4" /> },
    { id: "custom-tests", label: "Custom Tests", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <AnimatedPage className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground mt-1">Anonymized, bias-free candidate rankings and insights.</p>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-8 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "analytics" ? <AnalyticsTab /> : <CustomTestsTab />}
        </motion.div>
      </AnimatePresence>
    </AnimatedPage>
  );
}
