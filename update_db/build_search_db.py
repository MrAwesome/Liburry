#!/usr/bin/env python3

import csv
import json
import requests

from pathlib import Path

# TODO(high): fix javascript to use single letters
# TODO(high): gitignore csv / build dir
# TODO(high): fetch csv if it doesn't exist in a build dir
# TODO(high): create main()

# NOTE: You will need to install the unidecode library for this to work.
from unidecode import unidecode

DB_CSV_FILENAME: str = "ChhoeTaigi_MaryknollTaiengSutian.csv"
# TODO: add: ChhoeTaigi_TaioanPehoeKichhooGiku.csv
# TODO: add: ChhoeTaigi_EmbreeTaiengSutian.csv

DB_CSV_URL: str = "https://github.com/ChhoeTaigi/ChhoeTaigiDatabase/raw/master/ChhoeTaigiDatabase/" + DB_CSV_FILENAME
OUTPUT_JSON_FILENAME: str = "maryknoll.json"

BASE_DIR: Path = Path(__file__).parent.parent.absolute()
BUILD_DIR: Path = BASE_DIR.joinpath("build/")
PUBLIC_DIR: Path = BASE_DIR.joinpath("public/")

LOCAL_CACHED_CSV_PATH: Path = BUILD_DIR.joinpath(DB_CSV_FILENAME)
OUTPUT_JSON_PATH: Path = PUBLIC_DIR.joinpath(OUTPUT_JSON_FILENAME)


def fetch_db_data() -> None:
    print("Local CSV copy not detected, fetching...")
    resp = requests.get(DB_CSV_URL)
    f = open(LOCAL_CACHED_CSV_PATH, "wb+")
    f.write(resp.content)

def get_db_data_from_local_copy() -> str:
    print("Reading CSV file...")
    f = open(LOCAL_CACHED_CSV_PATH, "rb")
    _trash_char = f.read(3)
    rawbytes = f.read()
    return rawbytes.decode("utf-8")


def parse_csv(decoded: str) -> list[dict[str, str]]:
    print("Parsing CSV...")
    reader = csv.reader(decoded.splitlines())

    header = next(reader)

    # TODO: this header is only maryknoll, do this for each db
    if header != ["id","poj_unicode","poj_input","kip_unicode","kip_input","hoabun","english","page_number"]:
        raise ValueError("Headers have changed!")

    obj_list = []

    i = 0
    for _muh_id,poj_unicode,poj_input,_kip_unicode,_kip_input,hoabun,english,_page_number in reader:

        # Normalize text (remove diacritics)
        poj_normalized = unidecode(poj_unicode.replace("ⁿ", ""))

        muh_obj = {
            "p": poj_unicode,
            "n": poj_normalized,
            "i": poj_input,
            "h": hoabun,
            "e": english
        }
        obj_list.append(muh_obj)
        i += 1
    return obj_list

def convert_to_json(list_of_objs: list[dict[str, str]]) -> str:
    print("Converting to JSON...")
    return json.dumps(list_of_objs, ensure_ascii=False, separators=(',', ':'))

def write_to_db_file(jayson: str) -> None:
    print("Writing DB to file...")
    outfile = open(OUTPUT_JSON_PATH, "w+")
    outfile.write(jayson)

def main() -> None:
    # TODO: tag filename with git revision of master on chhoe repo
    if not Path(LOCAL_CACHED_CSV_PATH).is_file():
        fetch_db_data()
    rawbytes = get_db_data_from_local_copy()
    list_of_objs = parse_csv(rawbytes)
    jayson = convert_to_json(list_of_objs)
    write_to_db_file(jayson)

if __name__ == "__main__":
    main()
