import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../domain/model/user.entity';
import { UserApiEndpoint } from '../infrastructure/user-api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private readonly users: WritableSignal<User[]> = signal([]);
  private readonly selectedUser: WritableSignal<User | null> = signal(null);
  private readonly currentUser: WritableSignal<User | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly users$ = this.users.asReadonly();
  readonly selectedUser$ = this.selectedUser.asReadonly();
  readonly currentUser$ = this.currentUser.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor(private userApi: UserApiEndpoint) {
    // Inicializar currentUser desde localStorage si existe
    this.initializeFromLocalStorage();
  }

  /**
   * Inicializa el currentUser desde localStorage si existe
   */
  private initializeFromLocalStorage(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (currentUserStr && isAuthenticated === 'true') {
      try {
        const user = JSON.parse(currentUserStr);
        this.currentUser.set(user);
        console.log('✅ UserStore initialized with user:', user.email);
      } catch (error) {
        console.error('❌ Error parsing currentUser from localStorage:', error);
        this.clearCurrentUser();
      }
    }
  }

  loadAllUsers(): Observable<User[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.userApi.getAll().pipe(
      tap({
        next: (users) => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar usuarios');
          this.loading.set(false);
          console.error('Error loading users:', err);
        }
      })
    );
  }

  loadUserById(id: number): Observable<User> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.userApi.getById(id).pipe(
      tap({
        next: (user) => {
          this.selectedUser.set(user);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar usuario');
          this.loading.set(false);
          console.error('Error loading user:', err);
        }
      })
    );
  }

  createUser(user: User): Observable<User> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.userApi.create(user).pipe(
      tap({
        next: (newUser) => {
          this.users.update(users => [...users, newUser]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear usuario');
          this.loading.set(false);
          console.error('Error creating user:', err);
        }
      })
    );
  }

  updateUser(user: User): Observable<User> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.userApi.update(user, user.id).pipe(
      tap({
        next: (updatedUser) => {
          this.users.update(users => 
            users.map(u => u.id === updatedUser.id ? updatedUser : u)
          );
          this.selectedUser.set(updatedUser);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar usuario');
          this.loading.set(false);
          console.error('Error updating user:', err);
        }
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.userApi.delete(id).pipe(
      tap({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== id));
          if (this.selectedUser()?.id === id) {
            this.selectedUser.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar usuario');
          this.loading.set(false);
          console.error('Error deleting user:', err);
        }
      })
    );
  }

  setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
  }

  /**
   * Limpia el currentUser y localStorage
   */
  clearCurrentUser(): void {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    console.log('✅ UserStore cleared');
  }

  clearError(): void {
    this.error.set(null);
  }

  clearSelection(): void {
    this.selectedUser.set(null);
  }
}
