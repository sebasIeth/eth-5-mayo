import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, CONSULTOR_HARDCODE } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { DOCUMENTOS, docKey } from "../registro/data";
import {
  REGISTRO_CONSULTOR,
  type RespuestasVerif,
  type TipoEvaluacion,
  type PlanesFamilia,
} from "./data";
import { type VerifRevisiones } from "./revision";
import VerificacionForm from "./VerificacionForm";
import PlatformUser from "../components/PlatformUser";
import DescargarDoc from "../components/DescargarDoc";

export const metadata: Metadata = {
  title: "Lista de Verificación Inicial · Sello de Turismo de Salud",
  description:
    "Lista de verificación inicial (MSE-FO-55) para el diagnóstico del Sello de Turismo de Salud — Segmentos Especializados.",
};

export default async function VerificacionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.rol === "consultor") redirect("/consultor");
  if (!user.aceptoLegal) redirect("/consentimiento");

  const db = await getDb();
  const doc = await db.collection("registros").findOne({ usuarioId: user.id });

  const verif = (doc?.verificacion ?? {}) as {
    respuestas?: RespuestasVerif;
    estatus?: string;
    revisiones?: VerifRevisiones;
    tipoEvaluacion?: TipoEvaluacion;
    tieneRestaurante?: boolean;
    porcentajeObtenido?: number;
    planFamilia?: PlanesFamilia;
  };
  const respuestas: RespuestasVerif = verif.respuestas ?? {};
  const estatus = verif.estatus ?? "borrador";
  const revisiones = verif.revisiones;
  const tieneRegistro = !!doc?.estatus && doc.estatus !== "borrador";

  // Encabezado: se llena solo desde el Formato de Registro (MSE-FO-28).
  const docVerifInicial = DOCUMENTOS.find(
    (d) => d.codigo === "MSE-FO-55" && /inicial/i.test(d.nombre),
  );
  const documentos = (doc?.documentos ?? {}) as Record<string, string>;
  const encabezado = {
    empresa: (doc?.empresa?.razonSocial as string | undefined) ?? "",
    ejecutivo: (doc?.empresa?.representante as string | undefined) ?? "",
    evaluador: CONSULTOR_HARDCODE.nombre,
    registroConsultor: REGISTRO_CONSULTOR,
    fecha: docVerifInicial ? (documentos[docKey(docVerifInicial)] ?? "") : "",
    // Firma del ejecutivo = la que ya se capturó en el Formato de Registro.
    firmaEmpresa: (doc?.firma as string | undefined) ?? "",
  };
  const tipoEvaluacion: TipoEvaluacion = verif.tipoEvaluacion ?? "diagnostica";
  const tieneVerificacion =
    !!verif.respuestas && Object.keys(verif.respuestas).length > 0;

  return (
    <div className="rg-page">
      <header className="rg-top">
        <div className="rg-top__inner">
          <Link href="/dashboard" className="rg-back" aria-label="Ir al panel">
            <img src="/brand/directiva.png" alt="Directiva" />
          </Link>
          <PlatformUser nombre={user.nombre} />
        </div>
      </header>

      <main className="rg-main">
        <div className="rg-hero">
          <span className="rg-eyebrow">Lista de Verificación Inicial · MSE-FO-55</span>
          <h1>Diagnóstico inicial de tu establecimiento</h1>
          <p>
            Contesta las preguntas de las 5 familias que apliquen a tu giro. El
            cumplimiento se
            calcula sobre los indicadores que sí aplican; el mínimo para el Sello
            es 80%. Puedes guardar tu avance y completarlo poco a poco.
          </p>
          {!tieneRegistro && (
            <p className="vf-hint">
              Sugerencia: completa primero tu{" "}
              <Link href="/registro">Formato de Registro</Link> para agilizar el
              proceso.
            </p>
          )}
          {tieneVerificacion && (
            <div className="vf-hint">
              <DescargarDoc
                pdfUrl="/api/verificacion/pdf"
                altUrl="/api/verificacion/docx"
                altLabel="Word"
              />
            </div>
          )}
        </div>

        <VerificacionForm
          initial={respuestas}
          estatus={estatus}
          revisiones={revisiones}
          giro={doc?.registro?.giro ?? null}
          encabezado={encabezado}
          tipoInicial={tipoEvaluacion}
          tieneRestauranteInicial={verif.tieneRestaurante ?? false}
          porcentajeObtenidoInicial={verif.porcentajeObtenido ?? null}
          planFamiliaInicial={verif.planFamilia ?? {}}
        />
      </main>

      <footer className="rg-foot">
        <Link href="/dashboard">← Ir a mi panel</Link>
        <span>© 2026 Segmentos Especializados · Secretaría de Turismo de México</span>
      </footer>
    </div>
  );
}
