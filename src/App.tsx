import { useEffect } from "react";
import DesignGallery from "./DesignGallery";
import PlannerWorkspace from "./PlannerWorkspace";

export default function App() {
  const isDesign = window.location.pathname.replace(/\/$/, "") === "/design";
  useEffect(() => {
    document.title = isDesign ? "PlannerMC · Design system" : "PlannerMC · Work planning";
  }, [isDesign]);

  return isDesign
    ? <DesignGallery />
    : <PlannerWorkspace />;
}
