import { useCallback, useState } from 'react';
import { Search, SearchX, Users } from 'lucide-react';
import type { ManagedUser } from '@shared/admin';
import { Button } from '../../core/presenter/Button';
import { EmptyState } from '../../core/presenter/EmptyState';
import { INPUT_CLASSES } from '../../core/presenter/Field';
import { LoadErrorAlert } from '../../core/presenter/LoadErrorAlert';
import { SkeletonList } from '../../core/presenter/Skeleton';
import { useLoadedData } from '../../core/presenter/useLoadedData';
import type { AdminUsersService } from '../data/adminUsersService';
import { filterUsersByEmail } from '../logic/filterUsersByEmail';
import { formatRoleLabel } from '../logic/formatRoleLabel';
import { getRoleAction, type RoleAction } from '../logic/getRoleAction';

type UsersSectionProps = {
  adminUsersService: AdminUsersService;
};

/** Which user's role is being changed right now, and which change could not be saved. */
type RoleChangeState = {
  changingUserId: string | null;
  failedUserId: string | null;
};

type ChangeRole = (user: ManagedUser, roleAction: RoleAction) => void;

function replaceUser(users: ManagedUser[] | undefined, updatedUser: ManagedUser) {
  return users?.map((user) => (user.id === updatedUser.id ? updatedUser : user));
}

type UserActionProps = {
  user: ManagedUser;
  roleChange: RoleChangeState;
  onChangeRole: ChangeRole;
};

/** The button to give or take away Bienestar, and its error if it could not be saved. */
function UserAction({ user, roleChange, onChangeRole }: UserActionProps) {
  const roleAction = getRoleAction(user.role);
  return (
    <div className="space-y-2">
      {roleAction && (
        <Button
          variant="outline"
          onClick={() => onChangeRole(user, roleAction)}
          disabled={roleChange.changingUserId !== null}
          isLoading={roleChange.changingUserId === user.id}
          loadingText={roleAction.loadingText}
          className="w-full lg:w-auto"
        >
          {roleAction.label}
        </Button>
      )}
      {roleChange.failedUserId === user.id && (
        <p role="alert" className="rounded-xl bg-danger-50 p-2 text-sm text-danger-700">
          No se pudo cambiar el rol. Intenta nuevamente.
        </p>
      )}
    </div>
  );
}

function RoleChip({ user }: { user: ManagedUser }) {
  return (
    <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {formatRoleLabel(user.role)}
    </span>
  );
}

type UsersViewProps = {
  users: ManagedUser[];
  roleChange: RoleChangeState;
  onChangeRole: ChangeRole;
};

/** On phones: one card per user. */
function UserCards({ users, roleChange, onChangeRole }: UsersViewProps) {
  return (
    <ul aria-label="Usuarios" className="space-y-3 lg:hidden">
      {users.map((user) => (
        <li
          key={user.id}
          className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-0 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
            <RoleChip user={user} />
          </div>
          <UserAction user={user} roleChange={roleChange} onChangeRole={onChangeRole} />
        </li>
      ))}
    </ul>
  );
}

/** On big screens: a table, easier to read. */
function UsersTable({ users, roleChange, onChangeRole }: UsersViewProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-0 lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          <tr>
            <th scope="col" className="px-5 py-3">
              Nombre
            </th>
            <th scope="col" className="px-5 py-3">
              Correo
            </th>
            <th scope="col" className="px-5 py-3">
              Rol
            </th>
            <th scope="col" className="px-5 py-3 text-right">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-5 py-3 font-semibold text-neutral-900">{user.name}</td>
              <td className="px-5 py-3 text-neutral-600">{user.email}</td>
              <td className="px-5 py-3">
                <RoleChip user={user} />
              </td>
              <td className="px-5 py-3 text-right">
                <UserAction user={user} roleChange={roleChange} onChangeRole={onChangeRole} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The users, with a search box to find one by email. */
function UsersList({ users, roleChange, onChangeRole }: UsersViewProps) {
  const [searchedEmail, setSearchedEmail] = useState('');
  const foundUsers = filterUsersByEmail(users, searchedEmail);
  return (
    <div className="space-y-4">
      <div className="relative lg:max-w-sm">
        <label htmlFor="searched-email" className="sr-only">
          Buscar por correo
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden="true"
        />
        <input
          id="searched-email"
          type="search"
          value={searchedEmail}
          onChange={(event) => setSearchedEmail(event.target.value)}
          placeholder="Buscar por correo…"
          className={`${INPUT_CLASSES} pl-9`}
        />
      </div>
      {foundUsers.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos usuarios con ese correo"
          text="Revisa que el correo esté bien escrito."
        />
      ) : (
        <>
          <UserCards users={foundUsers} roleChange={roleChange} onChangeRole={onChangeRole} />
          <UsersTable users={foundUsers} roleChange={roleChange} onChangeRole={onChangeRole} />
        </>
      )}
    </div>
  );
}

/** The users of the app and their roles. */
export function UsersSection({ adminUsersService }: UsersSectionProps) {
  const loadUsers = useCallback(() => adminUsersService.listUsers(), [adminUsersService]);
  const { data: users, setData: setUsers, hasFailed, retry } = useLoadedData(loadUsers);
  const [roleChange, setRoleChange] = useState<RoleChangeState>({
    changingUserId: null,
    failedUserId: null,
  });

  async function changeRole(user: ManagedUser, roleAction: RoleAction) {
    setRoleChange({ changingUserId: user.id, failedUserId: null });
    try {
      const updatedUser = await adminUsersService.changeRole(user.id, roleAction.newRole);
      setUsers((current) => replaceUser(current, updatedUser));
      setRoleChange({ changingUserId: null, failedUserId: null });
    } catch {
      setRoleChange({ changingUserId: null, failedUserId: user.id });
    }
  }

  if (hasFailed) {
    return (
      <LoadErrorAlert
        message="No se pudieron cargar los usuarios. Intenta nuevamente."
        onRetry={retry}
      />
    );
  }
  if (users === undefined) {
    return <SkeletonList rows={4} label="Cargando usuarios…" />;
  }
  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Todavía no hay usuarios"
        text="Aparecerán cuando ingresen a Perdi-U."
      />
    );
  }
  return <UsersList users={users} roleChange={roleChange} onChangeRole={changeRole} />;
}
