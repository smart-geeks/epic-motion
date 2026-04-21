import { Metadata } from 'next';
import * as svc from '@/lib/services/staff-service';
import { StaffGrid } from '@/components/admin/staff/StaffGrid';
import { StaffHeader } from '@/components/admin/staff/StaffHeader';

export const metadata: Metadata = {
  title: 'Gestión de Staff | Epic Motion',
  description: 'Administración de maestros, recepcionistas y equipo administrativo.',
};

export default async function StaffPage() {
  const staff = await svc.obtenerTodoElStaff();

  return (
    <div className="space-y-8">
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
