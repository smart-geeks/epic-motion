"use client";

import { motion } from "framer-motion";
import { AttendanceCard } from "./AttendanceCard";

interface AttendanceListProps {
  alumnas: any[];
}

export function AttendanceList({ alumnas }: AttendanceListProps) {
  return (
    <div className="space-y-4 pb-12 transition-all">
      {alumnas.length === 0 ? (
        <div className="text-center py-20 text-white/20 font-inter text-sm">
          No hay alumnas registradas en este grupo.
        </div>
      ) : (
        alumnas.map((item, index) => (
          <AttendanceCard 
            key={item.alumnaId} 
            alumna={item.alumna} 
            index={index}
          />
        ))
      )}
    </div>
  );
}
