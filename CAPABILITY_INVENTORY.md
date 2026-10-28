# Apex Services — Capability Inventory

**Last Updated:** 2026-10-22  
**Environment:** Windows (PowerShell Shell), Java 21 LTS, Node.js v26.1.0, npm 11.0.0, Docker CLI 29.6.1, MySQL 8.0 (Port 3306).

| Capability / Tool Name | Actual Availability | Intended Use | Successfully Used? | Notes / Blockers |
| :--- | :--- | :--- | :--- | :--- |
| **Java 21 LTS / OpenJDK** | Available (`C:\...\java.exe`) | Spring Boot backend compilation and execution | YES | Compiles and runs `backend-0.0.1-SNAPSHOT.jar` |
| **Maven Wrapper (`mvnw.cmd`)** | Available in `Backend/` | Dependency resolution, test execution, compilation | YES | `.\mvnw.cmd test-compile` passes with BUILD SUCCESS |
| **MySQL 8.0 (Port 3306)** | Available & Connected | Primary relational persistence (`apex_services` database) | YES | TCP port 3306 verified; Flyway V1-V4 tables applied |
| **Docker CLI** | CLI Installed (v29.6.1) | Container orchestration for MySQL/Redis | PARTIAL | Docker engine not currently started; native MySQL running on 3306; Redis uses in-memory presence manager fallback |
| **Node.js (v26.1.0) & npm (11.0.0)** | Available | Vite React frontend compilation and dev servers | YES | Customer (5173), Admin (5174), Partner (5175) all active |
| **Spring WebSocket / STOMP** | Available (`spring-boot-starter-websocket`) | Real-time multi-partner dispatch and notifications | YES | Added to `pom.xml`, dependency resolved successfully |
| **Subagents Framework** | Available (`invoke_subagent`, `define_subagent`) | Parallel specialized engineering workstreams | YES | Multi-agent team execution available |
| **Filesystem & Code Editor Tools** | Available (`replace_file_content`, `write_to_file`, `view_file`) | Surgical code edits and artifact updates | YES | Zero-loss edits and continuous logging |
| **Background Task Manager** | Available (`run_command`, `manage_task`) | Process daemon management for servers and testing | YES | Port processes managed without locking conflicts |
| **Apollo-io, Namemyapp, Science MCPs** | Available | MCP external tools | NOT APPLICABLE | Domain-specific to CRM/Bio, not needed for core dispatch |
| **Ponytail / Omniroute Skills** | Available | Engineering discipline (YAGNI, minimal diffs, automated tests) | YES | Guides minimal, reliable code modifications |
