
import { MrCard } from "../mr_card/mr_card.jsx";

import { Styles as AppStyles } from "../../../../app/app.styles.jsx";
import { Styles } from "./board_column.style.js";

export function BoardColumn(props) {
  const {
    idPrefix,
    mergeRequests,
    onUploadDateChange = async () => {},
    title,
  } = props;

  const headingId = `columna-${idPrefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <Styles.Column aria-labelledby={headingId}>
      <Styles.ColumnHeader>
        <Styles.ColumnTitle id={headingId}>{title}</Styles.ColumnTitle>

        <Styles.Count>
          <span aria-hidden="true">{mergeRequests.length}</span>
          <AppStyles.VisuallyHidden>{mergeRequests.length} merge requests</AppStyles.VisuallyHidden>
        </Styles.Count>
      </Styles.ColumnHeader>

      <Styles.CardList role="list">
        {mergeRequests.map((mr) => (
          <li key={mr.id}>
            <MrCard mr={mr} onUploadDateChange={onUploadDateChange} />
          </li>
        ))}
      </Styles.CardList>
    </Styles.Column>
  );
}
