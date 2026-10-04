# parcel — 경비실 택배 보관 대장

터미널에서 쓰는 택배 접수·수령 도구. 데이터는 현재 폴더의 `parcels.json` 하나.

- `parcel in <동> <호> <택배사> [메모]` — 접수. 번호가 찍힌다.
- `parcel out <번호>` — 수령.
- `parcel list` — 보관 중 목록.
- `parcel find <동> <호>` — 그 집 택배(수령된 것 포함).

실행: `node bin/parcel.js …` 또는 `npm link` 뒤 `parcel …`. 테스트: `npm test`.
