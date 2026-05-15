import { MembersView } from '../members/MembersView';

export function AdminsView() {
  return (
    <MembersView
      resource="administrators"
      title="Management administratori"
      addLabel="Adauga administrator"
      countLabel="administratori"
      singularLabel="administratorul"
      showGroupsInList
    />
  );
}
