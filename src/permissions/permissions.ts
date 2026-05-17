export type RightName = string;

const impliedRights: Record<string, string[]> = {
  'users.manage': ['users.view'],
  'articles.manage': ['articles.view', 'articles.create', 'articles.update', 'articles.delete'],
  'subscriptions.manage': ['subscriptions.view', 'subscriptions.create', 'subscriptions.update', 'subscriptions.delete', 'subscriptions.restore'],
  'groups.manage': ['groups.view'],
  'rights.manage': ['rights.view'],
  'locations.manage': ['locations.view'],
  'events.manage': ['events.view'],
  'event_participants.manage': ['event_participants.view'],
};

export function expandRights(rights: Iterable<RightName>) {
  const expanded = new Set(rights);
  let changed = true;

  while (changed) {
    changed = false;
    expanded.forEach((right) => {
      impliedRights[right]?.forEach((impliedRight) => {
        if (!expanded.has(impliedRight)) {
          expanded.add(impliedRight);
          changed = true;
        }
      });
    });
  }

  return expanded;
}

export function hasRight(rights: Set<RightName>, rightName: RightName) {
  return rights.has(rightName);
}

export function hasAnyRight(rights: Set<RightName>, rightNames: RightName[] = []) {
  return rightNames.length === 0 || rightNames.some((right) => hasRight(rights, right));
}

export function hasAllRights(rights: Set<RightName>, rightNames: RightName[] = []) {
  return rightNames.every((right) => hasRight(rights, right));
}

export function extractUserRights(user: { groups?: Array<{ rights?: Array<{ name?: string }> }> } | null | undefined) {
  const baseRights = new Set<string>();
  user?.groups?.forEach((group) => {
    group.rights?.forEach((right) => {
      if (right.name) baseRights.add(right.name);
    });
  });
  return expandRights(baseRights);
}
