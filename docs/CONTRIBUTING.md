# 기여 및 협업 가이드

이 문서는 이세계 엘프들 팀의 개발 협업 규칙입니다. 아래 내용은 현재 팀의 기본 제안이며, 킥오프에서 합의한 변경 사항은 팀원 모두에게 공유하고 이 문서에 반영합니다.

## 브랜치 전략

| 브랜치 | 용도 | 규칙 |
| --- | --- | --- |
| `main` | 발표·데모 가능한 안정 버전 | 직접 push 금지. `develop`에서 PR로 반영 |
| `develop` | 팀 개발 통합 브랜치 | 직접 push 금지. 작업 브랜치에서 PR로 반영 |
| `feat/<영역>-<설명>` | 기능 개발 | `develop`에서 분기하고 작업 완료 뒤 PR |
| `fix/<영역>-<설명>` | 버그 수정 | `develop`에서 분기하고 작업 완료 뒤 PR |
| `docs/<설명>` | 문서 수정 | `develop`에서 분기하고 작업 완료 뒤 PR |
| `refactor/<영역>-<설명>` | 동작을 바꾸지 않는 구조 개선 | `develop`에서 분기하고 작업 완료 뒤 PR |
| `chore/<설명>` | 설정·도구 등 기타 작업 | `develop`에서 분기하고 작업 완료 뒤 PR |

영역은 `app`, `server`, `ai`, `design` 중 작업에 맞는 것을 사용합니다. 영역 구분이 불필요한 문서 작업은 생략해도 됩니다. 브랜치 이름은 소문자와 하이픈을 사용합니다.

예시: `feat/app-plant-gallery`, `feat/ai-plant-identification`, `fix/server-save-record`, `docs/readme`

## 시작하기와 작업 브랜치 만들기

저장소를 처음 받을 때:

```bash
git clone https://github.com/sy-luvia12/gdg-worktree-isekai-elf.git
cd gdg-worktree-isekai-elf
git fetch origin
git switch --track origin/develop
```

새 작업을 시작할 때는 `develop`의 최신 내용을 받은 뒤 작업 브랜치를 만듭니다.

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feat/app-plant-gallery
```

작업이 다른 날까지 이어지면 시작 전에 다시 `develop`을 최신화하고, 필요한 변경을 작업 브랜치에 반영합니다. 브랜치 하나에는 가능한 한 하나의 기능이나 이슈만 담습니다.

## 커밋 메시지

커밋 메시지는 아래 형식을 사용합니다.

```text
<type>(<영역>): <무엇을 바꿨는지>
```

| type | 용도 | 예시 |
| --- | --- | --- |
| `feat` | 사용자 기능 추가 | `feat(app): 식물 도감 카드 추가` |
| `fix` | 버그 수정 | `fix(server): 식물 기록 중복 저장 방지` |
| `docs` | 문서 변경 | `docs: README 협업 규칙 추가` |
| `refactor` | 동작을 바꾸지 않는 코드 구조 개선 | `refactor(ai): 식물 응답 파서 분리` |
| `test` | 테스트 추가·수정 | `test(server): 식물 검색 응답 테스트 추가` |
| `style` | 동작에 영향 없는 포맷·스타일 변경 | `style(app): 화면 코드 포맷 정리` |
| `chore` | 설정·의존성·유지보수 작업 | `chore: 앱 기본 설정 추가` |

커밋은 작고 목적이 분명한 단위로 만듭니다. `수정`, `완료`, `작업 중`처럼 변경 내용을 알 수 없는 메시지는 사용하지 않습니다. 한국어 또는 영어를 사용할 수 있지만 한 프로젝트 안에서는 일관성을 유지합니다.

## Push와 Pull Request

1. 작업 브랜치에서 변경을 커밋합니다.
2. 작업 브랜치를 GitHub에 push합니다. 첫 push에는 `-u`를 붙입니다.
   ```bash
   git push -u origin feat/app-plant-gallery
   ```
   이후 같은 브랜치에서는 `git push`를 사용합니다.
3. GitHub에서 작업 브랜치 → `develop` PR을 엽니다.
4. PR에는 배경, 변경 내용, 확인 방법, 관련 이슈를 적습니다. 화면이 바뀌면 스크린샷도 첨부합니다.
5. 다른 팀원 1명 이상이 변경을 검토하고, 피드백을 해결한 뒤 Squash and merge합니다.
6. 안정된 발표·데모 버전을 만들 때 PM 또는 팀장이 `develop` → `main` PR을 열고 팀 확인 뒤 합칩니다.
7. 합쳐진 작업 브랜치는 GitHub에서 삭제하고 로컬 브랜치도 정리합니다.

PR 제목도 커밋 형식에 맞춥니다. 예: `feat(app): 식물 도감 카드 추가`. 관련 이슈가 실제로 있다면 본문에 `Closes #번호`를 넣습니다.

로컬 브랜치 정리:

```bash
git switch develop
git pull --ff-only origin develop
git branch -d feat/app-plant-gallery
```

## 충돌 해결

충돌이 생기면 작업 브랜치에서 `develop` 최신 변경을 합칩니다. 자신의 작업 브랜치인지 확인한 뒤 진행하세요.

```bash
git switch feat/app-plant-gallery
git fetch origin
git merge origin/develop
# 충돌 표시가 있는 파일을 열어 의도에 맞게 수정
git add <수정한 파일>
git commit
git push
```

충돌 파일의 `<<<<<<<`, `=======`, `>>>>>>>` 표시를 모두 해결하고, 상대방 변경을 이해하지 못한 채 삭제하지 않습니다. 판단이 필요한 충돌은 해당 코드 담당자와 먼저 상의합니다.

## 금지 사항과 비밀 정보

- `main`, `develop`에 직접 push하지 않습니다.
- 팀원이 공유 중인 브랜치에 `git push --force`를 사용하지 않습니다.
- `.env`, API 키, 비밀번호, 개인 토큰, 인증서·비밀키를 저장소에 올리지 않습니다.
- 비밀 정보가 실수로 커밋되면 파일을 지우는 것만으로 끝내지 말고 해당 키를 즉시 폐기·재발급하고 팀장에게 알립니다.
- 기존 코드나 다른 팀원의 브랜치에 범위를 넓혀 변경할 때는 이유를 PR에 설명하고 담당자와 조율합니다.

GitHub 저장소 설정에서 `main`과 `develop`에 PR 승인 및 필수 확인을 요구하도록 보호 규칙을 설정하는 것을 권장합니다. 이 문서에 규칙을 적는 것만으로 직접 push가 기술적으로 차단되지는 않습니다.
