<p align="center">
  <img src="https://raw.githubusercontent.com/Gregwzx/Devtrack/main/devtrack-mobile/assets/images/icon.png" width="110" alt="DevTrack Logo"/>
</p>

<h1 align="center">DevTrack</h1>

<p align="center">
  Plataforma mobile gamificada para acompanhamento estruturado da evolução profissional por meio do registro contínuo de aprendizado.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react"/>
  <img src="https://img.shields.io/badge/Expo-51-000020?logo=expo"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot"/>
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql"/>
  <img src="https://img.shields.io/badge/status-completo-brightgreen"/>
</p>

---

## 📱 Sobre o Projeto

O **DevTrack** é uma aplicação **fullstack mobile** desenvolvida como projeto acadêmico de bimestre. Combina um backend **Spring Boot** com arquitetura limpa e um app **React Native (Expo)** com experiência gamificada inspirada no Duolingo.

> **"Transformar o aprendizado diário em progresso mensurável e visualmente compreensível."**

---

## ✨ Funcionalidades Implementadas

### 📲 Mobile (React Native + Expo)

| Feature | Descrição |
|---|---|
| 🔐 **Autenticação JWT** | Login, cadastro e modo visitante com tokens Bearer |
| 🏠 **Dashboard** | Header com paralaxe, streak, registros de aprendizado e timer Pomodoro |
| 🗺️ **Trilha de Aprendizado** | Mapa estilo Duolingo com 8 paradas por área de estudo |
| ❤️ **Sistema de Vidas** | 5 vidas, perde 1 ao errar, regenera 1 a cada 30 min |
| 🧠 **Quiz por Exercício** | Questões de múltipla escolha com explicação e feedback visual |
| 🏆 **Ranking Global** | Top jogadores ordenados por streak, XP ou aprendizados (dados reais do backend) |
| 👤 **Perfil + Avatar Studio** | Avatar DiceBear customizável, estatísticas, conquistas e nível |
| 🌐 **Offline-First** | Cache SQLite local + sincronização automática com o backend quando online |
| 💜 **Design System Unificado** | Paleta dark "dev" (`#0d0d10` + roxo `#8b5cf6`) consistente em todo o app |

### ⚙️ Backend (Spring Boot)

| Feature | Descrição |
|---|---|
| 🔑 **JWT Auth** | Registro, login, refresh token, autenticação stateless |
| 👤 **CRUD de Usuário** | Perfil, área de estudo, streak automático |
| 📝 **Aprendizados** | CRUD completo com paginação |
| 🏆 **Ranking** | Ordenação por streak, XP ou total de aprendizados |
| 📄 **Swagger UI** | Documentação interativa em `/swagger-ui.html` |
| 🏗️ **Clean Architecture** | Camadas `web → application → domain → infrastructure` |

---

## 🧱 Stack Tecnológica

### Mobile
- **React Native** + **Expo** (Expo Router para navegação)
- **TypeScript**
- **React Native Reanimated** (animações 60fps)
- **expo-sqlite** (banco local offline-first)
- **AsyncStorage** (cache de sessão e vidas)
- **lucide-react-native** (ícones)
- **DiceBear API** (geração de avatares SVG)

### Backend
- **Java 21** + **Spring Boot 3**
- **Spring Security** + **JWT** (auth stateless)
- **Spring Data JPA** + **Hibernate** (ORM)
- **MySQL 8** (banco relacional)
- **Lombok** (redução de boilerplate)
- **SpringDoc OpenAPI** (Swagger)
- **Maven** (gerenciamento de dependências)

---

## 🏗️ Arquitetura do Projeto

```
Devtrack/
├── devtrack-backend/          # API Spring Boot
│   └── src/main/java/com/devtrack/
│       ├── web/               # Controllers (REST + Swagger)
│       ├── application/       # Use Cases + DTOs
│       ├── domain/            # Entidades + Repositórios (interfaces)
│       └── infrastructure/    # JPA + Security (implementações)
│
└── devtrack-mobile/           # App React Native (Expo)
    ├── app/                   # Rotas (Expo Router file-based)
    │   └── (tabs)/            # Abas: Home, Trilhas, Ranking, Perfil
    └── src/
        ├── context/           # AuthContext, LivesContext
        ├── screens/           # Telas completas
        ├── services/          # API, userService, localDb, ai.service
        ├── data/              # exercises.ts, trail.ts
        └── components/        # Componentes reutilizáveis
```

---

## 🚀 Como Rodar Localmente

### Backend
```bash
cd devtrack-backend
# Certifique-se que o MySQL está rodando com o banco "devtrack"
.\run.bat           # Windows
# ou: mvn spring-boot:run

# Swagger disponível em:
# http://localhost:8080/swagger-ui.html
```

### Mobile
```bash
cd devtrack-mobile
npm install
npx expo start

# Abra o Expo Go no celular e escaneie o QR Code
# Para conectar ao backend local, configure o IP em src/services/api.ts
```

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Cadastro de usuário |
| `POST` | `/api/v1/auth/login` | Login (retorna JWT) |
| `POST` | `/api/v1/auth/refresh` | Refresh do token |
| `GET` | `/api/v1/users/me` | Perfil do usuário autenticado |
| `PUT` | `/api/v1/users/me` | Atualizar perfil |
| `GET` | `/api/v1/users/ranking` | Ranking global (sortBy, limit) |
| `GET` | `/api/v1/learnings` | Listar aprendizados (paginado) |
| `POST` | `/api/v1/learnings` | Registrar novo aprendizado |
| `DELETE` | `/api/v1/learnings/{id}` | Remover aprendizado |

> Todos os endpoints (exceto auth) requerem header: `Authorization: Bearer <token>`

---

## 👥 Divisão de Tarefas da Equipe

| Membro | Responsabilidades |
|---|---|
| **Jailson Ferreira** | Arquitetura mobile, sistema de vidas, trilhas, quiz, design system, integração API, offline-first |
| **Jailson Ferreira** | Backend Spring Boot, JWT, entidades JPA, use cases, ranking, Swagger, deploy local |

> *Projeto desenvolvido individualmente como composição acadêmica e portfólio profissional.*

---

## 🔗 Links

- 📱 **Repositório:** https://github.com/Gregwzx/Devtrack
- 📄 **Swagger UI:** `http://localhost:8080/swagger-ui.html` (backend rodando localmente)
- 👤 **Autor:** [Jailson Ferreira](https://github.com/Gregwzx)

---

<p align="center">
  Desenvolvido com 💜 como projeto acadêmico — FATEC 2025
</p>
