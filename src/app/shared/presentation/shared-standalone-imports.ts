import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Shared imports to include in standalone components so templates have access
// to NgIf, NgFor, ngModel, etc. Add more modules here as needed (Material, RouterLink).
export const SHARED_IMPORTS = [CommonModule, FormsModule];
