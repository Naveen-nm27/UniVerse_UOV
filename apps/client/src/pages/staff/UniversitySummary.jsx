import DashboardChart from "../../components/charts/DashboardChart";
import "./UniversitySummary.css";

const roleLabels = {
  STUDENT: "Students",
  LECTURER: "Lecturers",
  HOD: "Heads of department",
  DEAN: "Deans",
  MA: "Management assistants",
  ADMIN: "Administrators",
};
const count = (value) => value.toLocaleString();

export default function UniversitySummary({ data }) {
  const { users, devices, halls } = data;
  return (
    <section className="staff-university-summary" aria-labelledby="university-summary-title">
      <h2 id="university-summary-title">University summary</h2>
      <p>All university accounts, registered devices and halls.</p>
      <div className="ma-summary-grid staff-summary-cards">
        {[
          [
            "Total users",
            users.total,
            `${count(users.active)} active · ${count(users.inactive)} inactive`,
          ],
          [
            "Total devices",
            devices.total,
            `${count(devices.active)} active · ${count(devices.inactive)} inactive`,
          ],
          [
            "Total halls",
            halls.total,
            `${count(halls.withDevices)} with a device · ${count(halls.withoutDevices)} without a device`,
          ],
        ].map(([label, value, context]) => (
          <article className="ma-summary-card" key={label}>
            <span className="ma-card-label">{label}</span>
            <strong className="ma-card-value">{count(value)}</strong>
            <span className="ma-card-context">{context}</span>
          </article>
        ))}
      </div>
      <div className="dashboard-charts-grid">
        <DashboardChart
          title="University users by role"
          description="Active and inactive accounts across all departments."
          labels={users.byRole.map((row) => roleLabels[row.role])}
          datasets={[
            {
              label: "Active",
              data: users.byRole.map((row) => row.active),
              backgroundColor: "#6d287e",
            },
            {
              label: "Inactive",
              data: users.byRole.map((row) => row.inactive),
              backgroundColor: "#cc7a22",
            },
          ]}
          horizontal
          axisLabel="Users"
          height={300}
        />
        <DashboardChart
          title="University device status"
          description="Active and inactive device registrations across all halls."
          type="doughnut"
          labels={["Active", "Inactive"]}
          datasets={[
            {
              label: "Devices",
              data: [devices.active, devices.inactive],
              backgroundColor: ["#1d807d", "#cc7a22"],
            },
          ]}
          height={300}
          emptyMessage="No devices have been registered."
        />
      </div>
      <section className="staff-hall-summary" aria-labelledby="hall-summary-title">
        <h3 id="hall-summary-title">Hall summary</h3>
        <dl>
          {[
            ["Halls with a registered device", halls.withDevices],
            ["Halls without a device", halls.withoutDevices],
            ["Recorded seating capacity", halls.knownCapacity],
            ["Halls with capacity not recorded", halls.unknownCapacity],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{count(value)}</dd>
            </div>
          ))}
        </dl>
        <p>Seating capacity totals include only halls with a recorded capacity.</p>
      </section>
    </section>
  );
}
