import { useEffect, useState } from 'react';
import { SearchX, Users } from 'lucide-react';
import type { ManagedUser } from '@shared/admin';
import { Alert } from '../../core/presenter/Alert';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { Field, INPUT_CLASSES } from '../../core/presenter/Field';
import { SkeletonList } from '../../core/presenter/Skeleton';
import type { AdminUsersService } from '../data/adminUsersService';
import { filterUsersByEmail } from '../logic/filterUsersByEmail';
import { formatRoleLabel } from '../logic/formatRoleLabel';
import { getRoleAction, type RoleAction } from '../logic/getRoleAction';

type AdminPageProps = {
  adminUsersService: AdminUsersService;
};

/** The Administrator's page: the users of the app and their roles. */
export function AdminPage({ adminUsersService }: AdminPageProps) {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchedEmail, setSearchedEmail] = useState('');
  const [changingUserId, setChangingUserId] = useState<string | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setUsers(null);
    setHasFailed(false);
    adminUsersService
      .listUsers()
      .then((loadedUsers) => {
        if (isActive) {
          setUsers(loadedUsers);
        }
      })
      .catch(() => {
        if (isActive) {
          setHasFailed(true);
        }
      });
    return () => {
      isActive = false;
    };
  }, [adminUsersService, loadAttempt]);

  async function changeRole(user: ManagedUser, roleAction: RoleAction) {
    setChangingUserId(user.id);
    setFailedUserId(null);
    try {
      const updatedUser = await adminUsersService.changeRole(user.id, roleAction.newRole);
      setUsers(
        (current) =>
          current &&
          current.map((storedUser) =>
            storedUser.id === updatedUser.id ? updatedUser : storedUser,
          ),
      );
    } catch {
      setFailedUserId(user.id);
    } finally {
      setChangingUserId(null);
    }
  }

  const foundUsers = users ? filterUsersByEmail(users, searchedEmail) : [];

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-blue-700">Administración</h1>
        <p className="text-sm text-neutral-500">Gestiona al personal de Bienestar Estudiantil.</p>
      </div>
      {hasFailed ? (
        <div className="space-y-3">
          <div role="alert">
            <Alert>No se pudieron cargar los usuarios. Intenta nuevamente.</Alert>
          </div>
          <Button onClick={() => setLoadAttempt((value) => value + 1)}>Reintentar</Button>
        </div>
      ) : users === null ? (
        <SkeletonList rows={4} label="Cargando usuarios…" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no hay usuarios"
          text="Aparecerán cuando ingresen a Perdi-U."
        />
      ) : (
        <div className="space-y-4">
          <Field id="searched-email" label="Buscar por correo">
            <input
              id="searched-email"
              type="search"
              value={searchedEmail}
              onChange={(event) => setSearchedEmail(event.target.value)}
              placeholder="nombre.apellido@ucb.edu.bo"
              className={INPUT_CLASSES}
            />
          </Field>
          {foundUsers.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No encontramos usuarios con ese correo"
              text="Revisa que el correo esté bien escrito."
            />
          ) : (
            <ul aria-label="Usuarios" className="space-y-3">
              {foundUsers.map((user) => {
                const roleAction = getRoleAction(user.role);
                return (
                  <li
                    key={user.id}
                    className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{user.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {formatRoleLabel(user.role)}
                      </span>
                    </div>
                    {roleAction && (
                      <Button
                        variant="outline"
                        onClick={() => changeRole(user, roleAction)}
                        disabled={changingUserId !== null}
                        isLoading={changingUserId === user.id}
                        loadingText={roleAction.loadingText}
                        className="w-full"
                      >
                        {roleAction.label}
                      </Button>
                    )}
                    {failedUserId === user.id && (
                      <p
                        role="alert"
                        className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700"
                      >
                        No se pudo cambiar el rol. Intenta nuevamente.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
