import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-content.html',
  styleUrl: './footer-content.css'
})
export class FooterContentComponent {
  currentYear: number = new Date().getFullYear();
  
  links = {
    company: [
      { label: 'Acerca de', url: '/about' },
      { label: 'Contacto', url: '/contact' },
      { label: 'Carreras', url: '/careers' }
    ],
    support: [
      { label: 'Centro de Ayuda', url: '/help' },
      { label: 'Documentación', url: '/docs' },
      { label: 'FAQ', url: '/faq' }
    ],
    legal: [
      { label: 'Privacidad', url: '/privacy' },
      { label: 'Términos', url: '/terms' },
      { label: 'Cookies', url: '/cookies' }
    ]
  };

  socialLinks = [
    { icon: '📘', name: 'Facebook', url: '#' },
    { icon: '🐦', name: 'Twitter', url: '#' },
    { icon: '📸', name: 'Instagram', url: '#' },
    { icon: '💼', name: 'LinkedIn', url: '#' }
  ];
}
