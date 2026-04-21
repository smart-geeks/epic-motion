"use client";

import { motion } from "framer-motion";
import { StaffCard } from "./StaffCard";

interface StaffGridProps {
  staff: any[];
}

export function StaffGrid({ staff }: StaffGridProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {staff.map((member) => (
        <StaffCard key={member.id} member={member} />
      ))}
    </motion.div>
  );
}
