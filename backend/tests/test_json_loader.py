import pytest
from app.utils.json_loader import load_json_data, load_visible_items, DATA_DIR


def test_load_json_data_valid():
    # Cargar un archivo existente para verificar que funciona
    data = load_json_data("contact.json")
    assert isinstance(data, dict)
    assert "email" in data


def test_load_json_data_not_found():
    with pytest.raises(FileNotFoundError):
        load_json_data("non_existent_file.json")


def test_load_visible_items():
    # Cargar y verificar que filtra y ordena correctamente
    items = load_visible_items("projects.json")
    assert isinstance(items, list)
    
    # Verificar que todos los elementos retornados son visibles
    for item in items:
        assert item.get("visible", True) is not False
        
    # Verificar que están ordenados por el campo 'order'
    orders = [item.get("order", 0) for item in items]
    assert orders == sorted(orders)


@pytest.mark.parametrize("filename", [
    "projects.json",
    "skills.json",
    "timeline.json",
    "languages.json",
    "softskills.json",
    "education.json",
    "experience.json",
    "certifications.json",
    "contact.json"
])
def test_all_data_files_are_valid_json(filename):
    # Verificar que todos los archivos de datos reales son JSON válidos
    data = load_json_data(filename)
    assert data is not None
