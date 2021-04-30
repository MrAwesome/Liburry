#!/usr/bin/env python3

import re

import csv
import json
import requests

from pathlib import Path

# TODO(high): gitignore csv / build dir
# TODO(high): fetch csv if it doesn't exist in a build dir
# TODO(high): create main()
# TODO(high): known broken words:
#             "le"
#             /Reading/ - Embre<F7>

# NOTE: You will need to install the unidecode library for this to work.
from unidecode import unidecode

DB_CSV_FILENAMES_AND_FIELDS = [
        {
            "csv_filename": "ChhoeTaigi_MaryknollTaiengSutian.csv",
            "expected_fields": ["id","poj_unicode","poj_input","kip_unicode","kip_input","hoabun","english","page_number"],
            "output_filename": "maryknoll.json",
        },

        {
            "csv_filename": "ChhoeTaigi_TaioanPehoeKichhooGiku.csv",
            "expected_fields": ["id","poj_unicode","poj_unicode_other","poj_input","poj_input_other","kip_unicode","kip_unicode_other","kip_input","kip_input_other","hoabun","english","english_soatbeng","noun_classifiers","example_su","opposite","example_ku_taibun_poj","example_ku_english","example_ku_hoabun","from_su","page_number"],
            "output_filename": "giku.json",
        },

        {
            "csv_filename": "ChhoeTaigi_EmbreeTaiengSutian.csv",
            "expected_fields": ["id","poj_unicode","poj_input","kip_unicode","kip_input","abbreviations","noun_classifiers","reduplication","hoabun","english","synonym","cf","page_number"],
            "output_filename": "embree.json",
        }
]

DB_CSV_URL_PREFIX: str = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/"
OUTPUT_JSON_FILENAME: str = "maryknoll.json"

BASE_DIR: Path = Path(__file__).parent.parent.absolute()
BUILD_DIR: Path = BASE_DIR.joinpath("build/")
OUTPUT_DIR: Path = BASE_DIR.joinpath("public/db")

def fetch_csv_data(csv_filename: str, csv_filename_path: Path) -> None:
    print(f"Local CSV copy not detected for \"{csv_filename}\", fetching...")

    csv_url = DB_CSV_URL_PREFIX + csv_filename
    # TODO: check for errors
    resp = requests.get(csv_url)

    print(f"Writing to \"{csv_filename_path}\"...")
    f = open(csv_filename_path, "wb+")
    f.write(resp.content)

def get_db_data_from_local_copy(csv_filename_path: Path) -> str:
    print(f"Reading CSV file \"{csv_filename_path}\"...")
    f = open(csv_filename_path, "rb")
    _trash_char = f.read(3)
    rawbytes = f.read()
    return rawbytes.decode("utf-8")


def parse_csv(csv_filename: str, csv_text: str, expected_fields: list[str]) -> list[dict[str, str]]:
    print("Parsing CSV...")
    csv_lines = csv_text.splitlines()
    header_reader = csv.DictReader(csv_lines[:2])
    reader = csv.DictReader(csv_lines)

    # Check that the header values we see are expected
    next(header_reader)
    sorted_seen_fields = sorted(header_reader._fieldnames)
    sorted_expected_fields = sorted(expected_fields)
    if sorted_seen_fields != sorted_expected_fields:
        print(sorted_seen_fields)
        print(sorted_expected_fields)
        raise ValueError(f"Header fields have changed for {csv_filename}!")

    obj_list = []

    # TODO(high): print out values and make sure they match

    for row in reader:
        row_id = int(row["id"])
        poj_unicode = row["poj_unicode"]
        poj_input = row["poj_input"]
        hoabun = row["hoabun"]
        english = row["english"]

        # Normalize text (remove diacritics)
        poj_normalized = unidecode(poj_unicode.replace("ⁿ", ""))

        muh_obj = {
            "d": row_id,
            "p": poj_unicode,
            "n": poj_normalized,
            "i": poj_input,
            "h": hoabun,
            "e": english
        }
        obj_list.append(muh_obj)

    return obj_list

def convert_to_json(list_of_objs: list[dict[str, str]]) -> str:
    print("Converting to JSON...")
    return json.dumps(list_of_objs, ensure_ascii=False, separators=(',', ':'))

def write_to_db_file(outfile_name: str, jayson: str) -> None:
    print("Writing DB to file...")
    outfile_path = OUTPUT_DIR.joinpath(outfile_name)
    outfile = open(outfile_path, "w+")
    outfile.write(jayson)

def main() -> None:
    # TODO: tag filename with git revision of master on chhoe repo
    for csv_entry in DB_CSV_FILENAMES_AND_FIELDS:
        csv_filename = csv_entry["csv_filename"]
        expected_fields =  csv_entry["expected_fields"]
        output_filename = csv_entry["output_filename"]

        csv_filename_path = BUILD_DIR.joinpath(csv_filename)

        if not csv_filename_path.is_file():
            fetch_csv_data(csv_filename, csv_filename_path)
        decoded_rawbytes = get_db_data_from_local_copy(csv_filename_path)
        list_of_objs = parse_csv(csv_filename, decoded_rawbytes, expected_fields)
        jayson = convert_to_json(list_of_objs)
        write_to_db_file(output_filename, jayson)

if __name__ == "__main__":
    main()
