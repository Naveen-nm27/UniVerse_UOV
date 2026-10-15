import { useState } from "react";
import { useRemote } from "../../hooks/use-remote";
import { RequestState, Table, Pagination } from "../../components/RemoteData";
export default function AuditActivity() {
  const [page, setPage] = useState(1),
    records = useRemote(`/staff/audit?page=${page}`);
  return (
    <>
      <h1>Audit activity</h1>
      <RequestState {...records} />
      {records.data && (
        <section className="ma-panel">
          <Table
            rows={records.data.data}
            columns={[
              { key: "actedAt", label: "Date" },
              { key: "actor", label: "Actor" },
              { key: "resource", label: "Resource" },
              { key: "rowId", label: "Record" },
              { key: "action", label: "Action" },
            ]}
          />
          <Pagination meta={records.data.meta} onPage={setPage} />
        </section>
      )}
    </>
  );
}
