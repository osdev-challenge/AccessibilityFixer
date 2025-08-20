import React from "react";

export default function AriaProptypesViolations() {
  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      {/* 1) aria-hidden: 허용값은 "true" | "false" */}
      <div aria-hidden="0">잘못된 aria-hidden 값</div>

      {/* 2) aria-level: 허용값은 1~6 정수 */}
      <h3 aria-level="0">잘못된 aria-level 값</h3>

      {/* 3) aria-sort: 허용값은 "none" | "ascending" | "descending" | "other" */}
      <table aria-sort="ascending">
        <tbody>
          <tr>
            <td>잘못된 aria-sort 값</td>
          </tr>
        </tbody>
      </table>

      {/* 4) aria-checked: 허용값은 "true" | "false" | "mixed" */}
      <input type="checkbox" aria-checked="maybe" />

      {/* 5) aria-live: 허용값은 "off" | "polite" | "assertive" */}
      <div aria-live="loud">잘못된 aria-live 값</div>

      {/* 6) aria-haspopup: 허용값은 true | "menu" | "listbox" | "tree" | "grid" | "dialog" */}
      <button aria-haspopup="dropdown">잘못된 aria-haspopup 값</button>

      {/* 7) aria-current: 허용값은 "page" | "step" | "location" | "date" | "time" | true | false */}
      <a href="#" aria-current="yesterday">
        잘못된 aria-current 값
      </a>

      {/* 8) aria-orientation: 허용값은 "horizontal" | "vertical" */}
      <div role="listbox" aria-orientation="diagonal">
        잘못된 aria-orientation 값
      </div>

      {/* 9) aria-valuenow: 숫자여야 함 */}
      <div role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="max">
        잘못된 aria-valuenow 값
      </div>

      {/* 10) aria-colcount: 0 이상의 정수여야 함 */}
      <div role="grid" aria-colcount="-3">
        잘못된 aria-colcount 값
      </div>

      {/* 11) aria-invalid: 허용값은 "grammar" | "spelling" | true | false */}
      <input aria-invalid="sometimes" placeholder="잘못된 aria-invalid 값" />

      {/* 12) aria-disabled: 허용값은 true | false */}
      <button aria-disabled="0">잘못된 aria-disabled 값</button>
    </div>
  );
}
