# Overview

InkFlow Studio is a comprehensive tattoo studio management system designed to streamline operations for tattoo businesses. The application handles appointment scheduling, client management, artist profiles, inventory tracking, and sales reporting. Built with modern web technologies, it provides a complete solution for managing all aspects of a tattoo studio's daily operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built using React with TypeScript, providing a modern, type-safe user interface. The application uses Vite as the build tool for fast development and optimized production builds. The UI is constructed with shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS for responsive design. Wouter is used for client-side routing, providing a lightweight navigation solution.

The frontend follows a modular component structure with dedicated pages for each major feature (appointments, clients, artists, inventory, sales). State management is handled through TanStack Query for server state synchronization and caching.

## Backend Architecture
The backend is an Express.js server built with TypeScript, following RESTful API principles. The server handles authentication, API routes, and database operations. The application uses a monolithic architecture with shared types between frontend and backend through a shared schema definition.

File upload functionality is implemented using Multer with local storage, supporting image uploads for tattoo references and artist portfolios. The server includes comprehensive logging and error handling middleware.

## Authentication System
Authentication is implemented using Replit's OpenID Connect integration with Passport.js. Sessions are managed using Express Session with PostgreSQL session storage via connect-pg-simple. The system supports role-based access control with different user roles (admin, artist, receptionist).

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes tables for users, artists, clients, appointments, inventory, and sales, with proper relationships and constraints.

Database migrations are managed through Drizzle Kit, and the connection is established using Neon's serverless PostgreSQL adapter for cloud deployment compatibility.

## API Structure
RESTful API endpoints are organized by resource type:
- `/api/auth/*` - Authentication and user management
- `/api/appointments/*` - Appointment CRUD operations
- `/api/clients/*` - Client management with search capabilities
- `/api/artists/*` - Artist profiles and management
- `/api/inventory/*` - Inventory tracking and stock management
- `/api/sales/*` - Sales transactions and reporting
- `/api/upload/*` - File upload handling

Each endpoint includes proper error handling, validation using Zod schemas, and authentication middleware.

## Component Architecture
The UI components are organized into feature-based modules with reusable UI components from shadcn/ui. Modal dialogs are used for create/edit operations, and the layout includes a responsive sidebar navigation system.

Forms use React Hook Form with Zod validation for type-safe form handling. The application includes specialized components for tattoo-specific features like body part selection and reference image uploads.

# External Dependencies

## Core Framework Dependencies
- **React 18+** - Frontend framework with modern hooks and concurrent features
- **Express.js** - Backend web framework for Node.js
- **TypeScript** - Type safety across the entire application stack
- **Vite** - Build tool and development server

## Database and ORM
- **PostgreSQL** - Primary database (Neon serverless compatible)
- **Drizzle ORM** - Type-safe database operations and schema management
- **@neondatabase/serverless** - PostgreSQL connection for serverless environments

## Authentication
- **Replit Auth (OpenID Connect)** - Primary authentication provider
- **Passport.js** - Authentication middleware
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store

## UI and Styling
- **Tailwind CSS** - Utility-first styling framework
- **shadcn/ui** - Pre-built component library based on Radix UI
- **Radix UI** - Unstyled, accessible UI components
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management

## State Management and Data Fetching
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form state management and validation
- **Zod** - Runtime type validation and schema definition

## File Handling
- **Multer** - File upload middleware
- **Local file storage** - Images stored in uploads directory

## Development Tools
- **ESBuild** - JavaScript bundler for production builds
- **PostCSS** - CSS processing with Tailwind
- **Replit plugins** - Development environment integration