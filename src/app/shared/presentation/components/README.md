# Componentes Compartidos de ChroniCaree

Esta carpeta contiene todos los componentes compartidos y reutilizables de la aplicación.

## 📁 Estructura de Componentes

Cada componente sigue la siguiente estructura de nombrado:

```
[nombre]-content/
├── [nombre]-content.ts       # Componente TypeScript
├── [nombre]-content.html     # Template HTML
├── [nombre]-content.css      # Estilos CSS
└── [nombre]-content.spec.ts  # Tests unitarios
```

## 🎨 Componentes Disponibles

### 1. **ToolbarContentComponent** (`toolbar-content/`)
- **Selector**: `<app-toolbar-content />`
- **Descripción**: Barra de navegación lateral con menú colapsable
- **Características**:
  - Logo de ChroniCaree
  - Menú de navegación con iconos
  - Toggle para expandir/colapsar
  - Rutas configurables

### 2. **HeaderContentComponent** (`header-content/`)
- **Selector**: `<app-header-content />`
- **Descripción**: Cabecera superior de la aplicación
- **Características**:
  - Barra de búsqueda
  - Selector de idioma
  - Notificaciones con badge
  - Menú de usuario con dropdown

### 3. **FooterContentComponent** (`footer-content/`)
- **Selector**: `<app-footer-content />`
- **Descripción**: Pie de página de la aplicación
- **Características**:
  - Logo y descripción
  - Enlaces organizados por categorías
  - Redes sociales
  - Copyright dinámico

### 4. **LanguageSwitcherContentComponent** (`language-switcher-content/`)
- **Selector**: `<app-language-switcher-content />`
- **Descripción**: Selector de idioma
- **Características**:
  - Soporte para ES, EN, PT
  - Dropdown con banderas
  - Indicador visual del idioma activo

### 5. **LayoutContentComponent** (`layout-content/`)
- **Selector**: `<app-layout-content />`
- **Descripción**: Layout principal que integra todos los componentes
- **Características**:
  - Integra toolbar, header, footer
  - Maneja el router-outlet
  - Diseño responsive

## 🔧 Clases Base

### BaseEntity
Interface para entidades con ID único.

### BaseResource
Interface para DTOs del API.

### BaseAssembler
Interface para conversores entre Resource y Entity.

### BaseApiEndpoint
Clase abstracta con operaciones CRUD genéricas.

### BaseApi
Clase base para servicios de API.

## 📝 Uso

### Importar un componente individual:
```typescript
import { ToolbarContentComponent } from '@app/shared/presentation/components/toolbar-content/toolbar-content';
```

### Importar desde el barrel:
```typescript
import { 
  LayoutContentComponent,
  ToolbarContentComponent,
  HeaderContentComponent 
} from '@app/shared/presentation/components';
```

### Usar el Layout completo:
```typescript
import { Component } from '@angular/core';
import { LayoutContentComponent } from '@app/shared/presentation/components';

@Component({
  selector: 'app-root',
  imports: [LayoutContentComponent],
  template: '<app-layout-content />'
})
export class App {}
```

## 🎨 Personalización

Todos los componentes utilizan las variables CSS globales definidas en `styles.css`:

- `--color-cc-green`: Color primario
- `--color-cc-bold-green`: Color secundario
- `--color-cc-red`: Color de acento
- `--color-cc-dark-blue`: Color oscuro
- `--spacing-*`: Espaciados
- `--font-*`: Fuentes

## 🧪 Tests

Cada componente incluye su archivo `.spec.ts` con tests unitarios:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
ng test --include='**/toolbar-content.spec.ts'
```

## 📱 Responsive

Todos los componentes son completamente responsive:
- **Desktop**: >1024px
- **Tablet**: 768px - 1024px
- **Mobile**: <768px

## ✅ Checklist para nuevo componente

Al crear un nuevo componente compartido:

- [ ] Crear carpeta `[nombre]-content/`
- [ ] Crear `[nombre]-content.ts` con selector `app-[nombre]-content`
- [ ] Crear `[nombre]-content.html`
- [ ] Crear `[nombre]-content.css`
- [ ] Crear `[nombre]-content.spec.ts`
- [ ] Marcar como `standalone: true`
- [ ] Agregar exports al `index.ts`
- [ ] Documentar en este README
- [ ] Escribir tests unitarios
- [ ] Verificar responsive design
