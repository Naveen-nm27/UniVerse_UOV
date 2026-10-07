import { useEffect, useMemo, useState } from "react";
import {
  getLecturerAssessments,
  getLecturerMe,
  getLecturerOfferingDetails,
  getLecturerOfferings,
  getLecturerOverview,
  getLecturerResultHistory,
  getLecturerResults,
  getLecturerSessionDetails,
  getLecturerSessions,
  getLecturerTimetable,
} from "../../api/lecturer";
import { clearStoredSession, readStoredSession } from "../../auth/session";
import LecturerOverview from "./LecturerOverview";
import LecturerProfile from "./LecturerProfile";
import LecturerOfferingDetails from "./LecturerOfferingDetails";
import LecturerOfferings from "./LecturerOfferings";
import LecturerTimetable from "./LecturerTimetable";
import LecturerSessions from "./LecturerSessions";
import LecturerSessionDetails from "./LecturerSessionDetails";
import LecturerAssessments from "./LecturerAssessments";
import LecturerResults from "./LecturerResults";
import LecturerShell from "./components/LecturerShell";
import RequestState from "./components/RequestState";
import "./LecturerDashboard.css";

function parseRoute(pathname) {
  if (pathname === "/lecturer" || pathname === "") {
    return { page: "overview" };
  }

  if (pathname === "/lecturer/modules") {
    return { page: "modules" };
  }

  if (pathname.startsWith("/lecturer/modules/")) {
    const candidate = pathname.replace("/lecturer/modules/", "").split("/")[0];
    const parsed = Number(candidate);
    return Number.isInteger(parsed) && parsed > 0 ? { page: "module-detail", offeringId: parsed } : { page: "not-found" };
  }

  if (pathname === "/lecturer/timetable") {
    return { page: "timetable" };
  }

  if (pathname === "/lecturer/sessions") {
    return { page: "sessions" };
  }

  if (pathname.startsWith("/lecturer/sessions/")) {
    const candidate = pathname.replace("/lecturer/sessions/", "").split("/")[0];
    const parsed = Number(candidate);
    return Number.isInteger(parsed) && parsed > 0 ? { page: "session-detail", sessionId: parsed } : { page: "not-found" };
  }

  if (pathname === "/lecturer/assessments") {
    return { page: "assessments" };
  }

  if (pathname === "/lecturer/results") {
    return { page: "results" };
  }

  if (pathname === "/lecturer/profile") {
    return { page: "profile" };
  }

  return { page: "not-found" };
}

function getSearchParams() {
  return new URLSearchParams(window.location.search);
}

export default function LecturerDashboard() {
  const [resourceState, setResourceState] = useState("checking");
  const [profile, setProfile] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [routeVersion, setRouteVersion] = useState(0);

  const route = useMemo(() => parseRoute(window.location.pathname), [routeVersion]);
  const search = useMemo(() => getSearchParams(), [routeVersion]);
  const semesterId = search.get("semesterId") || "";
  const offeringId = route.page === "module-detail" ? String(route.offeringId) : search.get("offeringId") || "";
  const page = search.get("page") || "1";

  useEffect(() => {
    const session = readStoredSession();
    const role = session?.user?.role;
    const token = session?.token;

    if (!token) {
      window.location.assign("/");
      return;
    }

    if (role !== "LECTURER" && role !== "lecturer") {
      setAccessDenied(true);
      setResourceState("denied");
      return;
    }

    getLecturerMe()
      .then((data) => {
        setProfile(data || session.user);
        setResourceState("ready");
      })
      .catch((error) => {
        if (error?.status === 401) {
          clearStoredSession();
          window.location.assign("/");
          return;
        }

        if (error?.status === 403) {
          setAccessDenied(true);
          setResourceState("denied");
          return;
        }

        setAccessDenied(false);
        setResourceState("ready");
      });
  }, []);

  const patchUrl = (nextPath) => {
    window.history.pushState({}, "", nextPath);
    setRouteVersion((value) => value + 1);
  };

  const routeData = {
    sessionId: route.sessionId,
    offeringId: route.offeringId,
    semesterId,
    page: page,
    route,
    setRouteVersion,
    patchUrl,
  };

  const renderPage = () => {
    if (resourceState === "checking") {
      return <RequestState status="loading" message="Loading lecturer workspace…" />;
    }

    if (resourceState === "denied" || accessDenied) {
      return <RequestState status="denied" message="Access denied. This workspace is only available to lecturers." />;
    }

    switch (route.page) {
      case "overview":
        return <LecturerOverview profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "modules":
        return <LecturerOfferings profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "module-detail":
        return <LecturerOfferingDetails offeringId={route.offeringId} profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "timetable":
        return <LecturerTimetable profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "sessions":
        return <LecturerSessions profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "session-detail":
        return <LecturerSessionDetails sessionId={route.sessionId} profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "assessments":
        return <LecturerAssessments profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "results":
        return <LecturerResults profile={profile} semesterId={semesterId} patchUrl={patchUrl} />;
      case "profile":
        return <LecturerProfile profile={profile} patchUrl={patchUrl} />;
      default:
        return <RequestState status="error" message="This lecturer page could not be found." />;
    }
  };

  return (
    <LecturerShell
      profile={profile}
      activePath={window.location.pathname}
      semesterId={semesterId || "Semester 1"}
      onSemesterChange={() => {}}
    >
      {renderPage()}
    </LecturerShell>
  );
}
