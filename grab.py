"""
Description :
-----------
Ce script scrappe les données des buffs et nerfs des champions en ARAM
depuis le site https://aramnerfs.com/. Il récupère les informations suivantes :
 - Dégâts infligés
 - Dégâts subis
 - Autres modifications
Les données sont ensuite stockées dans un fichier JSON (champions.json).
"""

import requests
from bs4 import BeautifulSoup
import json

def scrape_champions():
    """
    Scrape les statistiques des champions en ARAM depuis le site aramnerfs.com.
    Les données sont ensuite sauvegardées dans un fichier JSON.
    """
    # URL cible pour le scraping
    url = "https://aramnerfs.com/"

    # Envoi de la requête HTTP
    response = requests.get(url)

    # Vérification de la réponse HTTP
    if response.status_code != 200:
        print(f"Erreur lors de l'accès à {url}. Code de statut: {response.status_code}")
        return

    # Analyse du contenu HTML de la page
    soup = BeautifulSoup(response.text, "html.parser")

    # Sélection des lignes contenant les données des champions
    rows = soup.select("tr.champion-card")

    # Initialisation du dictionnaire des champions
    champions = {}

    # Parcours des lignes extraites
    for row in rows:
        # Extraction du nom du champion
        name_cell = row.select_one("td.image-container")
        damage_dealt_cell = row.select_one("td.positive, td.none, td.negative")  # Dégâts infligés
        damage_taken_cell = row.select("td")[2]  # Dégâts subis (2e cellule)
        other_cell = row.select_one("td.otherCell")  # Autres changements

        if name_cell:
            # Récupère uniquement le nom du champion (évite d'inclure d'autres éléments)
            name = name_cell.text.strip().split("\n")[0]
        else:
            continue  # Ignore si le nom est absent

        # Extraction des valeurs des différentes statistiques
        damage_dealt = damage_dealt_cell.text.strip() if damage_dealt_cell else "N/A"
        damage_taken = damage_taken_cell.text.strip() if damage_taken_cell else "N/A"
        other = other_cell.text.strip() if other_cell else "N/A"

        # Ajout des données au dictionnaire des champions
        champions[name] = {
            "damage_dealt": damage_dealt,
            "damage_taken": damage_taken,
            "other": other
        }

    # Sauvegarde des données scrappées dans un fichier JSON
    with open("champions.json", "w", encoding="utf-8") as json_file:
        json.dump(champions, json_file, ensure_ascii=False, indent=4)

    print("Les données des champions ont été enregistrées dans 'champions.json'.")

# Exécution du script si lancé directement
if __name__ == "__main__":
    scrape_champions()