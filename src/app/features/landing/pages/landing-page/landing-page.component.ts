import { Component } from '@angular/core';
import { ROUTE_PATHS } from '../../../../core/constants/route-paths.constants';
import {
  LandingBenefit,
  LandingFeature,
} from '../../models/landing-content.model';
import { LandingBenefitsComponent } from '../../components/landing-benefits/landing-benefits.component';
import { LandingCtaComponent } from '../../components/landing-cta/landing-cta.component';
import { LandingFeaturesComponent } from '../../components/landing-features/landing-features.component';
import { LandingFooterComponent } from '../../components/landing-footer/landing-footer.component';
import { LandingHeroComponent } from '../../components/landing-hero/landing-hero.component';
import { LandingNavbarComponent } from '../../components/landing-navbar/landing-navbar.component';
import { LandingOverviewComponent } from '../../components/landing-overview/landing-overview.component';
import { LandingProcessComponent } from '../../components/landing-process/landing-process.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    LandingBenefitsComponent,
    LandingCtaComponent,
    LandingFeaturesComponent,
    LandingFooterComponent,
    LandingHeroComponent,
    LandingNavbarComponent,
    LandingOverviewComponent,
    LandingProcessComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent {
  protected readonly loginRoute = ROUTE_PATHS.login;

  protected readonly features: LandingFeature[] = [
    {
      icon: 'fa-solid fa-calendar-check',
      title: 'Asistencia centralizada',
      description: 'Registra entradas, retardos, faltas y justificantes en una sola vista.',
      tone: 'success',
    },
    {
      icon: 'fa-solid fa-id-card',
      title: 'NFC y codigos QR',
      description: 'Identifica alumnos de forma rapida con tarjetas NFC o codigos QR.',
      tone: 'info',
    },
    {
      icon: 'fa-solid fa-users-gear',
      title: 'Gestion academica',
      description: 'Administra alumnos, profesores, grupos, materias y horarios desde el portal.',
      tone: 'neutral',
    },
    {
      icon: 'fa-solid fa-file-circle-check',
      title: 'Justificantes y reclamos',
      description: 'Da seguimiento a solicitudes y validaciones con informacion trazable.',
      tone: 'warning',
    },
    {
      icon: 'fa-solid fa-chart-line',
      title: 'Datos en tiempo real',
      description: 'Consulta indicadores de asistencia para actuar antes de que el problema crezca.',
      tone: 'info',
    },
    {
      icon: 'fa-solid fa-shield-halved',
      title: 'Acceso por rol',
      description: 'Cada usuario ve solo las funciones y datos autorizados para su perfil.',
      tone: 'danger',
    },
  ];

  protected readonly benefits: LandingBenefit[] = [
    {
      icon: 'fa-solid fa-bolt',
      title: 'Rapidez',
      description: 'Reduce el tiempo de pase de lista y evita capturas repetidas.',
    },
    {
      icon: 'fa-solid fa-lock',
      title: 'Seguridad',
      description: 'Mantiene el acceso segmentado para administradores, docentes y alumnos.',
    },
    {
      icon: 'fa-solid fa-robot',
      title: 'Automatizacion',
      description: 'Convierte registros diarios en informacion lista para consulta y reportes.',
    },
    {
      icon: 'fa-solid fa-circle-check',
      title: 'Menos errores',
      description: 'Disminuye omisiones y duplicidad frente a procesos manuales.',
    },
    {
      icon: 'fa-solid fa-database',
      title: 'Informacion central',
      description: 'Concentra asistencias, reclamos y justificantes en el portal web.',
    },
    {
      icon: 'fa-solid fa-user-shield',
      title: 'Control por roles',
      description: 'Entrega una experiencia adecuada para cada responsabilidad academica.',
    },
  ];
}
