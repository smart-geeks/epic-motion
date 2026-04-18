import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────

interface Disciplina {
  nombre: string;
  horaTexto: string;
}

interface PDFInscripcionProps {
  alumna: { nombre: string; apellido: string; fechaInscripcion: string };
  grupoNombre: string;
  disciplinas: Disciplina[];
  cicloEscolar: string;
  tutor: { nombre: string; apellido: string; email: string; telefono: string | null };
  cuotaInscripcion: number;
  precioMensualidad: number;
  pago: { metodoPago: string; montoAjustado: number | null; motivoAjuste: string };
  emailPadre: string;
  passwordTemporal: string;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const GOLD = '#C9A227';
const BLACK = '#0A0A0A';
const GRAY = '#666666';
const LIGHT = '#F5F5F5';
const METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
};

function fmt(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
}

function extractHora(horaTexto: string): string {
  const m = horaTexto.match(/\d{1,2}:\d{2}[–\-]\d{1,2}:\d{2}/);
  return m ? m[0] : horaTexto;
}

interface DayBlock { label: string; items: Disciplina[] }

function groupByDay(disciplinas: Disciplina[]): DayBlock[] {
  const lunMier = disciplinas.filter(d => /lun|mié|mie|miercoles/i.test(d.horaTexto));
  const marJue  = disciplinas.filter(d => /mar|jue|jueves/i.test(d.horaTexto) && !/lun|mié|mie/i.test(d.horaTexto));
  const sab     = disciplinas.filter(d => /sáb|sab|sabado/i.test(d.horaTexto));
  const classified = new Set([...lunMier, ...marJue, ...sab]);
  const otros   = disciplinas.filter(d => !classified.has(d));

  const blocks: DayBlock[] = [];
  if (lunMier.length) blocks.push({ label: 'LUN & MIER', items: lunMier });
  if (marJue.length)  blocks.push({ label: 'MAR & JUE',  items: marJue });
  if (sab.length)     blocks.push({ label: 'SÁBADO',     items: sab });
  if (otros.length)   blocks.push({ label: 'OTROS',      items: otros });
  return blocks;
}

// ─────────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:        { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', color: BLACK, fontSize: 10 },
  // Header
  headerWrap:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: GOLD, paddingBottom: 12 },
  logoEpic:    { fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5, color: BLACK },
  logoMotion:  { fontSize: 22, fontFamily: 'Helvetica', color: BLACK },
  logoSub:     { fontSize: 8, color: GRAY, letterSpacing: 1 },
  logoBlock:   { flex: 1 },
  // Secciones
  section:     { marginBottom: 14 },
  sectionTitle:{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: GOLD, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: LIGHT, paddingBottom: 3 },
  row:         { flexDirection: 'row', marginBottom: 3 },
  label:       { width: 140, color: GRAY, fontSize: 9 },
  value:       { flex: 1, color: BLACK },
  // Tabla
  tableHead:   { flexDirection: 'row', backgroundColor: GOLD, padding: '4 6', borderRadius: 2, marginBottom: 2 },
  tableHeadTxt:{ color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 9, flex: 1 },
  tableRow:    { flexDirection: 'row', padding: '3 6', borderBottomWidth: 1, borderBottomColor: LIGHT },
  tableCell:   { flex: 1, fontSize: 9 },
  // Total
  totalRow:    { flexDirection: 'row', backgroundColor: LIGHT, padding: '5 8', borderRadius: 2, marginTop: 6 },
  totalLabel:  { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 11 },
  totalValue:  { fontFamily: 'Helvetica-Bold', fontSize: 11, color: GOLD },
  // Credenciales
  credBox:     { backgroundColor: '#FBF5E8', borderWidth: 1, borderColor: GOLD, borderRadius: 4, padding: 10, marginTop: 8 },
  credLabel:   { fontSize: 8, color: GRAY, marginBottom: 2 },
  credValue:   { fontFamily: 'Helvetica-Bold', fontSize: 11, color: BLACK, marginBottom: 6 },
  credPass:    { fontFamily: 'Helvetica-Bold', fontSize: 14, color: GOLD, letterSpacing: 2 },
  warning:     { fontSize: 8, color: '#B45309', marginTop: 6 },
  // Reglamento
  regTitle:    { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GOLD, textAlign: 'center', marginBottom: 16 },
  regSub:      { fontSize: 9, color: GRAY, textAlign: 'center', marginBottom: 20 },
  regNum:      { fontFamily: 'Helvetica-Bold', fontSize: 10, color: BLACK, marginBottom: 3, marginTop: 10 },
  regText:     { fontSize: 9, color: '#333', lineHeight: 1.5, marginBottom: 4 },
  firmaBox:    { marginTop: 30, borderTopWidth: 1, borderTopColor: '#CCC', paddingTop: 16 },
  firmaTitle:  { fontFamily: 'Helvetica-Bold', fontSize: 9, color: GRAY, marginBottom: 16 },
  firmaLine:   { borderBottomWidth: 1, borderBottomColor: '#999', marginBottom: 20, marginHorizontal: 10 },
  firmaLabel:  { fontSize: 8, color: GRAY, marginBottom: 20 },
  // Horario
  horTitle:    { fontSize: 20, fontFamily: 'Helvetica-Bold', color: GOLD, textAlign: 'center', marginBottom: 6 },
  horSub:      { fontSize: 9, color: GRAY, textAlign: 'center', marginBottom: 20 },
  blockLabel:  { fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'center', backgroundColor: BLACK, color: '#FFFFFF', padding: '4 8', borderRadius: 2, marginBottom: 4 },
  horaCell:    { backgroundColor: GOLD, padding: '4 8', borderRadius: 2, marginBottom: 2 },
  horaText:    { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#FFFFFF' },
  disciCell:   { backgroundColor: LIGHT, padding: '4 8', borderRadius: 2, marginBottom: 6 },
  disciText:   { fontSize: 9, color: BLACK },
});

// ─────────────────────────────────────────────────────────────────
// Sub-componentes reutilizables
// ─────────────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={s.headerWrap}>
      <View style={s.logoBlock}>
        <Text>
          <Text style={s.logoEpic}>EPIC </Text>
          <Text style={s.logoMotion}>MOTION</Text>
        </Text>
        <Text style={s.logoSub}>HIGH PERFORMANCE DANCE STUDIO</Text>
      </View>
    </View>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Página 1 — Resumen de inscripción
// ─────────────────────────────────────────────────────────────────

function Pagina1({ alumna, grupoNombre, disciplinas, cicloEscolar, tutor, cuotaInscripcion, precioMensualidad, pago, emailPadre, passwordTemporal }: PDFInscripcionProps) {
  const totalOriginal = cuotaInscripcion + precioMensualidad;
  const totalFinal = pago.montoAjustado ?? totalOriginal;
  const descuento = pago.montoAjustado !== null ? totalOriginal - totalFinal : 0;
  const fechaFormato = new Date(alumna.fechaInscripcion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Page size="LETTER" style={s.page}>
      <Header />

      {/* Datos de la alumna */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Datos de la Alumna</Text>
        <Campo label="Nombre" value={`${alumna.nombre} ${alumna.apellido}`} />
        <Campo label="Grupo" value={grupoNombre} />
        <Campo label="Ciclo escolar" value={cicloEscolar} />
        <Campo label="Fecha de inscripción" value={fechaFormato} />
      </View>

      {/* Datos del tutor */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Datos del Tutor</Text>
        <Campo label="Nombre" value={`${tutor.nombre} ${tutor.apellido}`} />
        <Campo label="Email" value={tutor.email} />
        {tutor.telefono && <Campo label="Teléfono" value={tutor.telefono} />}
      </View>

      {/* Clases inscritas */}
      {disciplinas.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Clases Inscritas</Text>
          <View style={s.tableHead}>
            <Text style={[s.tableHeadTxt, { flex: 1 }]}>Disciplina</Text>
            <Text style={[s.tableHeadTxt, { flex: 1 }]}>Horario</Text>
          </View>
          {disciplinas.map((d, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.tableCell}>{d.nombre}</Text>
              <Text style={s.tableCell}>{d.horaTexto}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Resumen de pago */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Resumen de Pago</Text>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadTxt, { flex: 2 }]}>Concepto</Text>
          <Text style={[s.tableHeadTxt, { flex: 1, textAlign: 'right' }]}>Monto</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={[s.tableCell, { flex: 2 }]}>Cuota de inscripción</Text>
          <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(cuotaInscripcion)}</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={[s.tableCell, { flex: 2 }]}>Mensualidad</Text>
          <Text style={[s.tableCell, { flex: 1, textAlign: 'right' }]}>{fmt(precioMensualidad)}</Text>
        </View>
        {descuento !== 0 && (
          <View style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 2, color: GRAY }]}>
              Descuento{pago.motivoAjuste ? ` — ${pago.motivoAjuste}` : ''}
            </Text>
            <Text style={[s.tableCell, { flex: 1, textAlign: 'right', color: GRAY }]}>-{fmt(Math.abs(descuento))}</Text>
          </View>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalValue}>{fmt(totalFinal)}</Text>
        </View>
        <View style={[s.row, { marginTop: 6 }]}>
          <Text style={s.label}>Método de pago</Text>
          <Text style={s.value}>{METODO[pago.metodoPago] ?? pago.metodoPago}</Text>
        </View>
      </View>

      {/* Credenciales */}
      {passwordTemporal && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Credenciales de Acceso al Portal</Text>
          <View style={s.credBox}>
            <Text style={s.credLabel}>Email de acceso</Text>
            <Text style={s.credValue}>{emailPadre}</Text>
            <Text style={s.credLabel}>Contraseña temporal</Text>
            <Text style={s.credPass}>{passwordTemporal}</Text>
            <Text style={s.warning}>⚠ Cambiar la contraseña en el primer inicio de sesión.</Text>
          </View>
        </View>
      )}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
// Página 2 — Reglamento Interno
// ─────────────────────────────────────────────────────────────────

const REGLAMENTO = [
  {
    num: '1. COMPROMISO DE PAGO',
    texto: 'El padre de familia o tutor se compromete a cubrir la totalidad de las mensualidades correspondientes al ciclo escolar vigente (basado en un periodo de 10 meses), o bien, los meses restantes en caso de ingreso extemporáneo. Para suspender el cobro de mensualidades, es indispensable tramitar la baja oficial de la alumna/o. En caso de reingreso, se deberá cubrir una cuota de reinscripción proporcional a la fecha de retorno.',
  },
  {
    num: '2. FECHAS Y MÉTODOS DE PAGO',
    texto: 'La colegiatura deberá liquidarse dentro de los primeros 10 días de cada mes. A partir del día 11, se aplicará un cargo por mora del 3% mensual.\nMétodos aceptados: Tarjetas de crédito y débito (VISA, MasterCard, AMEX), depósito bancario, transferencia electrónica y efectivo.',
  },
  {
    num: '3. BENEFICIOS Y DESCUENTOS',
    texto: 'Se otorgará un descuento familiar del 10% en la mensualidad a partir de la segunda alumna/o inscrita por familia. Este beneficio será válido únicamente si el pago se realiza dentro de los primeros 10 días del mes y no es acumulable con otras promociones.',
  },
  {
    num: '4. SUSPENSIÓN POR ADEUDO',
    texto: 'Cualquier cuenta que presente un retraso de 2 meses o más causará la suspensión automática del alumno/a, quien podrá reincorporarse una vez que el adeudo total sea liquidado y la cuenta esté al corriente.',
  },
  {
    num: '5. PARTICIPACIÓN EN EVENTOS',
    texto: 'Para participar en festivales, competencias, viajes, cursos o eventos especiales, el estado de cuenta deberá estar al corriente. Cualquier pago recibido por estos conceptos se aplicará prioritariamente a mensualidades vencidas en caso de existir adeudos.',
  },
  {
    num: '6. ASISTENCIA Y PUNTUALIDAD',
    texto: 'Faltas: Las clases o ensayos perdidos por causas ajenas a Epic Motion no serán sujetos a reposición ni reembolsos.\nPuntualidad: Se cuenta con una tolerancia de 5 minutos. Posterior a este tiempo, la academia se reserva el derecho de permitir el ingreso al aula. En caso de imprevistos, favor de notificar vía WhatsApp para informar a los docentes.',
  },
  {
    num: '7. UNIFORME Y DISCIPLINA',
    texto: 'Es obligatorio el uso del uniforme reglamentario en color negro para todas las disciplinas. En el caso específico de Ballet, es indispensable el uso de falda y chongo.',
  },
  {
    num: '8. CLASES PRIVADAS',
    texto: 'Las sesiones privadas deberán liquidarse por adelantado (vía transferencia o tarjeta) y solo podrán agendarse si la alumna/o se encuentra al corriente en sus mensualidades generales. La programación se gestionará en recepción o con el docente asignado.',
  },
];

function Pagina2() {
  return (
    <Page size="LETTER" style={s.page}>
      <Header />
      <Text style={s.regTitle}>► REGLAMENTO ADMINISTRATIVO GENERAL ◄</Text>
      <Text style={s.regSub}>EPIC MOTION DANCE STUDIO</Text>

      {REGLAMENTO.map((item) => (
        <View key={item.num}>
          <Text style={s.regNum}>{item.num}</Text>
          <Text style={s.regText}>{item.texto}</Text>
        </View>
      ))}

      <View style={s.firmaBox}>
        <Text style={s.firmaTitle}>Acepto cumplir el Reglamento</Text>
        <View style={s.firmaLine} />
        <Text style={s.firmaLabel}>Nombre y firma del tutor</Text>
        <Text style={[s.firmaLabel, { marginTop: 0 }]}>Fecha: ______________</Text>
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
// Página 3 — Horario Personal
// ─────────────────────────────────────────────────────────────────

function Pagina3({ grupoNombre, disciplinas, cicloEscolar }: { grupoNombre: string; disciplinas: Disciplina[]; cicloEscolar: string }) {
  const blocks = groupByDay(disciplinas);

  return (
    <Page size="LETTER" style={s.page}>
      <Header />
      <Text style={s.horTitle}>{grupoNombre.toUpperCase()}</Text>
      <Text style={s.horSub}>Ciclo {cicloEscolar}</Text>

      {blocks.map((block) => (
        <View key={block.label} style={{ marginBottom: 16 }}>
          <View style={{ backgroundColor: BLACK, padding: '4 10', borderRadius: 3, marginBottom: 6 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 10, textAlign: 'center' }}>
              {block.label}
            </Text>
          </View>
          {block.items.map((d, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <View style={s.horaCell}>
                <Text style={s.horaText}>{extractHora(d.horaTexto)}</Text>
              </View>
              <View style={s.disciCell}>
                <Text style={s.disciText}>{d.nombre}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      {disciplinas.length === 0 && (
        <Text style={[s.regText, { textAlign: 'center', color: GRAY, marginTop: 40 }]}>
          Sin disciplinas registradas.
        </Text>
      )}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
// Documento principal
// ─────────────────────────────────────────────────────────────────

export default function PDFInscripcion(props: PDFInscripcionProps) {
  return (
    <Document
      title={`Inscripción — ${props.alumna.nombre} ${props.alumna.apellido}`}
      author="Epic Motion Dance Studio"
    >
      <Pagina1 {...props} />
      <Pagina2 />
      <Pagina3
        grupoNombre={props.grupoNombre}
        disciplinas={props.disciplinas}
        cicloEscolar={props.cicloEscolar}
      />
    </Document>
  );
}
