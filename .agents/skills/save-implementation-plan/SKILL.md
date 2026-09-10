---
name: save-implementation-plan
description: ルートのimplementation_plan.mdを保存し、その内容からADRとDesign Docを作成または更新した後、元の計画ファイルを削除する。
---

# Save Implementation Plan

リポジトリルートの `implementation_plan.md` を、プロジェクトの正式なドキュメントへ反映する。

## Workflow

1. リポジトリルートに `implementation_plan.md` が存在することを確認する。

   - 存在しない場合は、ファイルを作成せず処理を終了してユーザーへ報告する。

2. 必要に応じて以下のディレクトリを作成する。

   - `docs/prompt`
   - `docs/adr`
   - `docs/design`

3. `implementation_plan.md` を次のパスへコピーして保存する。

   ```text
   docs/prompt/implementation_plan_yyyyMMddHHmmss.md
   ```

   - `yyyyMMddHHmmss` には実行時のローカル日時を使用する。
   - 保存内容は元の `implementation_plan.md` から変更しない。
   - 同名ファイルが存在する場合は上書きせず、新しいタイムスタンプを使用する。

4. `implementation_plan.md` に含まれる重要なアーキテクチャ上の意思決定からADRを作成し、`docs/adr` へ保存する。

   - 既存のADR命名規則やテンプレートがあれば、それを優先する。
   - 命名規則がない場合は、次のファイル名を使用する。

     ```text
     docs/adr/adr-yyyyMMddHHmmss-<decision-slug>.md
     ```

   - Michael Nygard形式に準拠し、以下のセクションを含める。

     ```markdown
     # <Decision title>

     ## Status

     Proposed

     ## Context

     ## Decision

     ## Consequences
     ```

   - 計画に記載されていない決定事項を推測で確定しない。
   - 未決事項がある場合は、その旨を明記する。
   - 独立した重要な意思決定が複数ある場合は、ADRを分割する。

5. `implementation_plan.md` をもとにDesign Docを作成または更新し、`docs/design` へ保存する。

   - 関連する既存Design Docがある場合は、そのファイルを更新する。
   - 既存の命名規則やテンプレートがあれば、それを優先する。
   - 関連するDesign Docがなく命名規則もない場合は、次のファイル名で作成する。

     ```text
     docs/design/design-yyyyMMddHHmmss-<feature-slug>.md
     ```

   - Google Design Docsの考え方に基づき、計画に該当する以下の内容を整理する。

     ```markdown
     # <Design title>

     ## Summary

     ## Context

     ## Goals

     ## Non-goals

     ## Proposed Design

     ## Alternatives Considered

     ## Risks and Trade-offs

     ## Testing Strategy

     ## Rollout Plan

     ## Open Questions
     ```

   - 元の計画に情報がないセクションは推測で埋めず、`Not specified` または未決事項として扱う。

6. 以下を確認する。

   - `docs/prompt` にImplementation Planの原文が保存されている。
   - ADRがMichael Nygard形式を満たしている。
   - Design Docが作成または適切に更新されている。
   - 元の計画にない決定を事実として追加していない。

## Cleanup

7. すべての成果物について保存と内容確認が成功した場合のみ、リポジトリルートの `implementation_plan.md` を削除する。

   以下の場合は削除しない。

   - Implementation Planのアーカイブ保存に失敗した。
   - ADRの作成に失敗した。
   - Design Docの作成または更新に失敗した。
   - 出力内容に未解決のエラーがある。

8. 削除後、リポジトリルートに `implementation_plan.md` が存在しないことを確認する。

9. 最後に以下をユーザーへ報告する。

   - 保存したImplementation Planのパス
   - 作成または更新したADRのパス
   - 作成または更新したDesign Docのパス
   - 元の `implementation_plan.md` を削除したか
   - 未決事項または追加確認が必要な内容