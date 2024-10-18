import { useRef, useState, useEffect, useCallback } from "react";
import Places from "./components/Places.jsx";
import { AVAILABLE_PLACES } from "./data.js";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import { sortPlacesByDistance } from "./loc.js";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const selectedPlace = useRef();
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [pickedPlaces, setPickedPlaces] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  // Async function to get location
  const getLocation = async () => {
    // Check if location is already stored in localStorage
    const storedLocation = localStorage.getItem("userLocation");
    if (storedLocation) {
      const { latitude, longitude } = JSON.parse(storedLocation);
      return { latitude, longitude };
    }

    // If not, request location access
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Store the location in localStorage
          localStorage.setItem(
            "userLocation",
            JSON.stringify({ latitude, longitude })
          );
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  // UseEffect to get the location and sort places
  useEffect(() => {
    const fetchLocationAndPlaces = async () => {
      try {
        const { latitude, longitude } = await getLocation();
        const sortedPlaces = sortPlacesByDistance(
          AVAILABLE_PLACES,
          latitude,
          longitude
        );
        setAvailablePlaces(sortedPlaces);
      } catch (error) {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access denied. Please enable location services.");
        } else {
          alert("Unable to retrieve location. Please try again.");
        }
      } finally {
        setLoading(false); // End loading when data is fetched
      }
    };

    if ("geolocation" in navigator) {
      fetchLocationAndPlaces();
    } else {
      alert("Geolocation is not supported by this browser.");
      setLoading(false); // Stop loading if geolocation is not supported
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
      
      {/* Display loader when loading */}
      {loading ? (
        <p>Loading places...</p>
      ) : (
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
            fallbackText="No places available."
            onSelectPlace={handleSelectPlace}
          />
        </main>
      )}
    </>
  );
}

export default App;
