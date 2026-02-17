import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'capitulos',
    loadComponent: () => import('./pages/capitulos/capitulos.component').then(m => m.CapitulosComponent)
  },
  {
    path: 'capitulos/:volumen/:numero',
    loadComponent: () => import('./pages/lector/lector.component').then(m => m.LectorComponent)
  },
  {
    path: 'mundo',
    loadComponent: () => import('./pages/mundo/mundo-nuevo.component').then(m => m.MundoComponent)
  },
  {
    path: 'personajes',
    loadComponent: () => import('./pages/personajes/personajes.component').then(m => m.PersonajesComponent)
  },
  {
    path: 'bestiario',
    loadComponent: () => import('./pages/bestiario/bestiario.component').then(m => m.BestiarioComponent)
  },
  {
    path: 'sobre',
    loadComponent: () => import('./pages/sobre/sobre.component').then(m => m.SobreComponent)
  },
  {
    path: 'sobre/manifiesto',
    loadComponent: () => import('./pages/sobre/manifiesto-mundo/manifiesto-mundo.component').then(m => m.ManifiestoMundoComponent)
  },
  {
    path: 'sobre/licencia',
    loadComponent: () => import('./pages/sobre/licencia/licencia.component').then(m => m.LicenciaComponent)
  },
  {
    path: 'sobre/privacidad',
    loadComponent: () => import('./pages/sobre/privacidad/privacidad.component').then(m => m.PrivacidadComponent)
  },
  {
    path: 'sobre/terminos',
    loadComponent: () => import('./pages/sobre/terminos/terminos.component').then(m => m.TerminosComponent)
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contacto/contacto.component').then(m => m.ContactoComponent)
  },
  {
    path: 'commits',
    loadComponent: () => import('./pages/commits/commits.component').then(m => m.CommitsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

