import { ListsSidebar } from "./ListsSidebar";
import { ListDetail } from "./ListDetail";
import { ListDetailLoadingPanel } from "./ListDetailLoadingPanel";
import styles from "./ListsWorkspace.module.css";
import type { ListsWorkspaceProps, MobileView } from "../types";

export function ListsWorkspace(props: ListsWorkspaceProps) {
  return (
    <div className={`${styles.scope} app-grid mobile-view-${props.mobileView}`}>
      <ListsSidebar
        activeListId={props.activeListId}
        draggedListId={props.draggedListId}
        isLoading={props.isLoading}
        listDropIndicator={props.listDropIndicator}
        lists={props.lists}
        onCreateList={props.onCreateList}
        onReorderListByDrop={props.onReorderListByDrop}
        onSelectActiveList={props.onSelectActiveList}
        setDraggedListId={props.setDraggedListId}
        setListDropIndicator={props.setListDropIndicator}
      />
      <ListDetail {...props} />
    </div>
  );
}

export function ListsWorkspaceLoadingView({
  canCreate,
  mobileView,
  onCreateList,
  onShowMobileListIndex,
}: {
  canCreate: boolean;
  mobileView: MobileView;
  onCreateList: (() => void) | null;
  onShowMobileListIndex: (() => void) | null;
}) {
  const noopReorderList = () => undefined;
  const noopSetDraggedList = () => undefined;
  const noopSetListDropIndicator = () => undefined;
  const noopSelectList = () => undefined;

  return (
    <div className={`${styles.scope} app-grid mobile-view-${mobileView}`}>
      <ListsSidebar
        activeListId={null}
        draggedListId={null}
        isLoading
        listDropIndicator={null}
        lists={[]}
        onCreateList={onCreateList ?? noopSelectList}
        onReorderListByDrop={noopReorderList}
        onSelectActiveList={noopSelectList}
        setDraggedListId={noopSetDraggedList}
        setListDropIndicator={noopSetListDropIndicator}
      />

      <section className="panel list-detail-panel">
        <ListDetailLoadingPanel onShowMobileListIndex={onShowMobileListIndex} />
      </section>
    </div>
  );
}
