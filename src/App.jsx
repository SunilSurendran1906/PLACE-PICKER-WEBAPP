import { useRef, useState, useEffect, useCallback } from "react";

import Places from "./components/Places.jsx";
import { AVAILABLE_PLACES } from "./data.js";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import { sortPlacesByDistance } from "./loc.js";

const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
const storedPlaces = storedIds.map((id) =>
  AVAILABLE_PLACES.find((place) => place.id === id)
);
function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const selectedPlace = useRef();
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [pickedPlaces, setPickedPlaces] = useState(storedPlaces);
  useEffect(() => {
    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Store user's location in localStorage
          localStorage.setItem(
            "userLocation",
            JSON.stringify({ latitude, longitude })
          );

          // Sort places based on user's location
          const sortedPlaces = sortPlacesByDistance(
            AVAILABLE_PLACES,
            latitude,
            longitude
          );
          setAvailablePlaces(sortedPlaces);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert("Location access denied. Please enable location services.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert(
              "Location information is unavailable. Please check your device settings."
            );
          } else if (error.code === error.TIMEOUT) {
            alert("Request for location timed out. Please try again.");
          } else {
            alert("Unable to retrieve location. Please try again.");
          }
        }
      );
    };

    if ("geolocation" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") {
            getLocation(); // If permission is already granted
          } else if (result.state === "prompt") {
            // If prompt is needed, force it by requesting the location
            getLocation();
          } else if (result.state === "denied") {
            alert("Please allow location access in your browser settings.");
          }

          // Watch for permission changes
          result.onchange = () => {
            if (result.state === "granted") {
              getLocation();
            }
          };
        })
        .catch(() => {
          // In case the permissions API is not supported, directly request geolocation
          getLocation();
        });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  function handleStartRemovePlace(id) {
    setModalOpen(true);
    selectedPlace.current = id;
  }

  function handleStopRemovePlace() {
    setModalOpen(false);
  }

  function handleSelectPlace(id) {
    setPickedPlaces((prevPickedPlaces) => {
      if (prevPickedPlaces.some((place) => place.id === id)) {
        return prevPickedPlaces;
      }
      const place = AVAILABLE_PLACES.find((place) => place.id === id);
      return [place, ...prevPickedPlaces];
    });
    const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
    if (storedIds.indexOf(id) === -1) {
      localStorage.setItem(
        "selectedPlaces",
        JSON.stringify([id, ...storedIds])
      );
    }
  }

  const handleRemovePlace = useCallback(function handleRemovePlace() {
    setPickedPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current)
    );
    setModalOpen(false);
    const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];

    localStorage.setItem(
      "selectedPlaces",
      JSON.stringify(storedIds.filter((id) => id !== selectedPlace.current))
    );
  }, []);

  return (
    <>
      <Modal open={modalOpen} onCLose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        <Places
          title="I'd like to visit ..."
          fallbackText={"Select the places you would like to visit below."}
          places={pickedPlaces}
          onSelectPlace={handleStartRemovePlace}
        />
        <Places
          title="Available Places"
          places={availablePlaces}
          fallbackText="Sorting places distance..."
          onSelectPlace={handleSelectPlace}
        />
      </main>
    </>
  );
}

export default App;
