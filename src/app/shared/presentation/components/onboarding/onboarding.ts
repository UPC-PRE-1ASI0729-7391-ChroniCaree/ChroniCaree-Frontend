import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Onboarding Component - US22: Tutorial interactivo para nuevos usuarios
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css'
})
export class OnboardingComponent implements OnInit {
  currentStep = signal<number>(0);
  isVisible = signal<boolean>(false);

  // Pasos del tutorial
  readonly steps = [
    {
      title: '¡Bienvenido a ChroniCaree! 🎉',
      description: 'Tu plataforma integral para el cuidado de enfermedades crónicas. Déjanos mostrarte las funcionalidades principales.',
      icon: '👋',
      highlight: null,
      position: 'center'
    },
    {
      title: 'Registra tus Síntomas Diarios 📝',
      description: 'Mantén un seguimiento detallado de tus síntomas, signos vitales y cómo te sientes cada día. Tu doctor recibirá alertas automáticas.',
      icon: '📊',
      highlight: null,
      position: 'center',
      action: {
        label: 'Ver Registro de Síntomas',
        route: '/clinical/symptoms/register'
      }
    },
    {
      title: 'Revisa tu Historial Médico 🏥',
      description: 'Accede a todos tus diagnósticos con códigos ICD-10, revisa su estado (activo/controlado/resuelto) y monitorea tu evolución.',
      icon: '📋',
      highlight: null,
      position: 'center',
      action: {
        label: 'Ver Historial',
        route: '/medical-records/diagnoses'
      }
    },
    {
      title: 'Gestiona tus Medicamentos 💊',
      description: 'Lleva control de tus medicamentos, recibe recordatorios y marca cuando los has tomado. Nunca olvides una dosis.',
      icon: '⏰',
      highlight: null,
      position: 'center'
    },
    {
      title: 'Actualiza tu Perfil 👤',
      description: 'Mantén tu información personal actualizada. El sistema calculará automáticamente tu IMC y te ayudará a monitorear cambios.',
      icon: '⚙️',
      highlight: null,
      position: 'center',
      action: {
        label: 'Ir a Mi Perfil',
        route: '/patient/edit-profile'
      }
    },
    {
      title: '¡Todo Listo! 🚀',
      description: 'Ya conoces las funciones principales. Puedes volver a ver este tutorial en cualquier momento desde la configuración.',
      icon: '✨',
      highlight: null,
      position: 'center'
    }
  ];

  // Progreso actual
  progress = computed(() => ((this.currentStep() + 1) / this.steps.length) * 100);

  // Verificar si es el primer paso
  isFirstStep = computed(() => this.currentStep() === 0);

  // Verificar si es el último paso
  isLastStep = computed(() => this.currentStep() === this.steps.length - 1);

  // Paso actual
  currentStepData = computed(() => this.steps[this.currentStep()]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkIfFirstVisit();
  }

  /**
   * Verifica si es la primera visita del usuario
   */
  private checkIfFirstVisit(): void {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const userRole = localStorage.getItem('userRole');

    // Solo mostrar onboarding para pacientes en su primera visita
    if (!hasSeenOnboarding && userRole === 'patient') {
      // Pequeño delay para que cargue el dashboard primero
      setTimeout(() => {
        this.isVisible.set(true);
      }, 500);
    }
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep(): void {
    if (!this.isLastStep()) {
      this.currentStep.update(step => step + 1);
    } else {
      this.complete();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  previousStep(): void {
    if (!this.isFirstStep()) {
      this.currentStep.update(step => step - 1);
    }
  }

  /**
   * Salta a un paso específico
   */
  goToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStep.set(stepIndex);
    }
  }

  /**
   * Omite el tutorial
   */
  skip(): void {
    this.markAsCompleted();
    this.isVisible.set(false);
  }

  /**
   * Completa el tutorial
   */
  complete(): void {
    this.markAsCompleted();
    this.isVisible.set(false);
    
    // Mostrar mensaje de bienvenida
    this.showWelcomeMessage();
  }

  /**
   * Ejecuta la acción de un paso (navegar a una ruta)
   */
  executeStepAction(route?: string): void {
    if (route) {
      this.markAsCompleted();
      this.isVisible.set(false);
      this.router.navigate([route]);
    }
  }

  /**
   * Marca el onboarding como completado
   */
  private markAsCompleted(): void {
    localStorage.setItem('hasSeenOnboarding', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
  }

  /**
   * Muestra mensaje de bienvenida al completar
   */
  private showWelcomeMessage(): void {
    console.log('🎉 ¡Bienvenido a ChroniCaree! Tutorial completado.');
  }

  /**
   * Reinicia el onboarding (para testing o configuración)
   */
  static reset(): void {
    localStorage.removeItem('hasSeenOnboarding');
    localStorage.removeItem('onboardingCompletedAt');
  }
}
