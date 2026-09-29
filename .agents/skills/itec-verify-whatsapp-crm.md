---
name: itec-verify-whatsapp-crm
description: "Checklist de verificación del módulo masivo de WhatsApp, plantillas y CRM en ITEC"
---

# Verificación de WhatsApp CRM y Comunicación Masiva

## Plantillas de WhatsApp
- [ ] Tabla `whatsapp_templates` (mig. 0121): `titulo`, `body`, `categoria` (general|evento|socio|sponsor|medio)
- [ ] Soporte de variables dinámicas: `{nombre}`, `{institucion}`, `{enlace}`, etc.
- [ ] Componente `TemplatesSection.tsx` en `/dashboard/whatsapp`

## Agenda Unificada
- [ ] Tabla `whatsapp_contacts` (mig. 0131): `telefono` (UNIQUE), `nombre`, `fuente` (manual|vcf|csv|device|miembros), `es_agenda_itec`
- [ ] Consolidación de 6 fuentes de contactos
- [ ] Detección y prevención de duplicados por número normalizado
- [ ] Componente `SendSection.tsx`

## Grupos N:M
- [ ] Tabla `whatsapp_groups` (mig. 0132): `nombre`, `descriptor`
- [ ] Tabla `whatsapp_group_contacts` (mig. 0132): relación N:M grupo-contacto
- [ ] Componente `GroupsSection.tsx`

## Auditoría y Logs de Envíos
- [ ] Tabla `whatsapp_logs` (mig. 0133): auditoría de envíos, timestamp, estado, número destinatario y plantilla/texto utilizado
- [ ] Componente `WhatsAppDashboard.tsx`

## Normalización Telefónica
- [ ] Utilidad `src/lib/waPhone.ts`
- [ ] Normalización a formato E.164 argentino (`+54 9 ...`) y limpieza de prefijos `15`, `0`, `00`
