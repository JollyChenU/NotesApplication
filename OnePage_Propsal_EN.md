# Notes Application Project Proposal

## Project Overview

This project is a student practice project aimed at developing a practical note-taking application as comprehensively as possible, incorporating personal insights throughout the development process.

## Project Objectives

- Implement basic note management functionality
- Support Markdown format note editing
- Provide a clean and intuitive user interface
- Implement a basic user authentication system

## Core Feature Planning

### Basic Features
- **Markdown Editing System**
  - Standard Markdown syntax support
  - Real-time preview functionality
  - Shortcut key operation support

- **Note Management System**
  - Note creation and editing
  - Auto-save mechanism
  - Basic categorization functionality

- **User System (To be optimized)**
  - Basic registration and login
  - Personal note management

## Technical Solution

### Frontend Technology Stack

- **Core Framework**: React 18+
  - Learn component-based development
  - Understand state management
  - Master Hooks usage

- **UI Framework**: Material-UI (MUI) 5+
  - Learn component library usage
  - Practice responsive design

- **Core Dependencies**
  - React Markdown: Markdown rendering
  - Axios: Network request handling

- **Build Tool**: Vite
  - Modern build tool usage
  - Development environment configuration

### Backend Technology Stack

- **Web Framework**: Flask
  - Python Web development practice
  - RESTful API design

- **Data Storage**: SQLite + SQLAlchemy
  - Database design practice
  - ORM usage experience

### Database Technology

- **SQLite Selection Rationale**
  - Lightweight, zero configuration
  - Single file storage, easy deployment
  - Supports concurrent access
  - Suitable for small to medium applications

- **Database Table Design**
  - User Table
    - user_id (Primary Key)
    - username
    - password_hash
    - email
    - created_at

  - Note Table
    - note_id (Primary Key)
    - user_id (Foreign Key)
    - title
    - content
    - category
    - tags
    - created_at
    - updated_at

  - File Table
    - file_id (Primary Key)
    - note_id (Foreign Key)
    - file_name
    - file_path
    - file_type
    - upload_time

  - Image Table
    - image_id (Primary Key)
    - note_id (Foreign Key)
    - image_name
    - image_path
    - upload_time

- **SQLAlchemy Advantages**
  - Powerful ORM functionality
  - Data model mapping
  - Query builder
  - Transaction support
  - Data migration tools

## Development Plan

### Phase One: Project Initialization
1. Development environment setup
2. Project architecture design
3. Basic UI component development

### Phase Two: Core Feature Development
1. Markdown editor implementation
2. Note management functionality
3. Database design and implementation

### Phase Three: User System and Functionality Optimization
1. User authentication implementation
2. Personal note management
3. Support for note tags and categories
4. Support for dark mode
5. Support for image upload

## Technical Requirements

### Code Standards
- Follow team coding standards
- Write basic unit tests
- Use Git for version control

### Documentation Requirements
- Complete API documentation
- Database design documentation
- Deployment instruction documentation

## Project Highlights

### Technical Practice
- Full-stack development experience
- Modern frontend framework usage
- Database design practice

### Engineering Capabilities
- Project architecture design
- Team collaboration development
- Technical documentation writing

## Summary

This project, as a learning practice project, focuses on deepening the understanding of full-stack development technologies through practical development.