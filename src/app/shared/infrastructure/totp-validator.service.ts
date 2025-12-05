import { Injectable } from '@angular/core';
import { TOTP } from 'otpauth';

@Injectable({
  providedIn: 'root'
})
export class TotpValidatorService {
  
  validateToken(token: string, secret: string): boolean {
    try {
      const cleanSecret = secret.replace(/\s/g, '');
      
      const totp = new TOTP({
        secret: cleanSecret,
        digits: 6,
        period: 30
      });
      
      const delta = totp.validate({ token, window: 1 });
      
      return delta !== null;
    } catch (error) {
      console.error('Error validating TOTP token:', error);
      return false;
    }
  }

  generateToken(secret: string): string {
    try {
      const cleanSecret = secret.replace(/\s/g, '');
      const totp = new TOTP({
        secret: cleanSecret,
        digits: 6,
        period: 30
      });
      return totp.generate();
    } catch (error) {
      console.error('Error generating TOTP token:', error);
      return '';
    }
  }
}

