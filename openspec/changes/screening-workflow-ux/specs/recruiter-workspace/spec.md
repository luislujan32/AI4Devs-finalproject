## MODIFIED Requirements

### Requirement: Login and workspace interface
La UI SHALL permitir entrar/salir y cargar screenings propios, mostrar estados de carga, error, vacío y sesión vencida. En un screening publicado SHALL separar Configuración de Postulantes, y mostrar invitaciones y estados solo en Postulantes. La sesión del recruiter SHALL seguir vigente al abrir una sesión candidata en el mismo navegador.

#### Scenario: Published workspace
- **WHEN** el recruiter abre un screening publicado
- **THEN** puede alternar entre configuración de solo lectura y postulantes invitados sin mezclar ambos flujos

#### Scenario: Candidate uses same browser
- **WHEN** un candidato verifica su correo en el mismo navegador
- **THEN** su sesión no revoca la del recruiter
