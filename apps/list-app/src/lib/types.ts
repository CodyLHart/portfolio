export type Priority = "low" | "medium" | "high" | "urgent";
export type ListRole = "owner" | "editor" | "viewer";
export type FriendStatus = "pending" | "accepted" | "blocked";
export type NotificationType = "friend_request" | "list_invite" | "role_change";
export type ListItemFields = {
  assignee: boolean;
  category: boolean;
  dueDate: boolean;
  notes: boolean;
  priority: boolean;
  quantity: boolean;
};

export type Profile = {
  avatar_url: string | null;
  created_at: string;
  display_name: string;
  email: string;
  id: string;
  updated_at: string;
};

export type FriendRequest = {
  addressee_id: string;
  created_at: string;
  id: string;
  requester_id: string;
  requester?: Profile | null;
  addressee?: Profile | null;
  status: FriendStatus;
  updated_at: string;
};

export type List = {
  created_at: string;
  id: string;
  item_fields: ListItemFields | null;
  owner_id: string;
  share_token: string;
  sort_mode: "manual" | "category";
  title: string;
  updated_at: string;
};

export type Collaborator = {
  created_at: string;
  id: string;
  invited_by: string | null;
  list_id: string;
  profile?: Profile | null;
  role: ListRole;
  status: string;
  updated_at: string;
  user_id: string;
};

export type ListItem = {
  assigned_to: string | null;
  assignee?: Profile | null;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  due_date: string | null;
  id: string;
  list_id: string;
  notes: string | null;
  position: number;
  priority: Priority | null;
  quantity: string | null;
  title: string;
  updated_at: string;
};

export type Suggestion = {
  category: string | null;
  id: string;
  last_used_at: string;
  list_id: string;
  title: string;
  usage_count: number;
};

export type ListSnapshot = {
  created_at: string;
  created_by: string | null;
  id: string;
  items: SnapshotItem[];
  label: string;
  list_id: string;
};

export type SnapshotItem = Pick<
  ListItem,
  | "assigned_to"
  | "category"
  | "completed"
  | "due_date"
  | "notes"
  | "position"
  | "priority"
  | "quantity"
  | "title"
>;

export type Notification = {
  actor?: Profile | null;
  actor_id: string | null;
  created_at: string;
  id: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  recipient_id: string;
  type: NotificationType;
};

export type ItemDraft = {
  assigned_to: string;
  category: string;
  due_date: string;
  notes: string;
  priority: "" | Priority;
  quantity: string;
  title: string;
};

export const emptyItemDraft: ItemDraft = {
  assigned_to: "",
  category: "",
  due_date: "",
  notes: "",
  priority: "",
  quantity: "",
  title: "",
};
