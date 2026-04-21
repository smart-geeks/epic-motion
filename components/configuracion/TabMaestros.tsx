'use client';

import { StaffHeader } from '../admin/staff/StaffHeader';
import { StaffGrid } from '../admin/staff/StaffGrid';

interface TabMaestrosProps {
  staff: any[];
}

export default function TabMaestros({ staff }: TabMaestrosProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StaffHeader />
      
      {staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-[2.5rem] border-white/10">
          <p className="text-white/40 font-inter">No hay miembros del staff registrados aún.</p>
        </div>
      ) : (
        <StaffGrid staff={staff} />
      )}
    </div>
  );
}
