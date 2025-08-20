// src/test/sample-html-has-lang.jsx

import React from "react";

export default function TestHtmlHasLang() {
  return (
    <>
      {/* ❌ Case 1: lang 속성 자체 없음 */}
      <html >
        <head>
          <title>No lang attribute</title>
        </head>
        <body>
          <p>lang 속성이 없습니다.</p>
        </body>
      </html>

      {/* ❌ Case 2: 빈 문자열 */}
      <html >
        <head>
          <title>Empty lang</title>
        </head>
        <body>
          <p>lang 속성이 빈 문자열입니다.</p>
        </body>
      </html>

      {/* ❌ Case 3: 공백만 들어간 경우 */}
      <html lang="   ">
        <head>
          <title>Whitespace lang</title>
        </head>
        <body>
          <p>lang 속성이 공백뿐입니다.</p>
        </body>
      </html>

      {/* ❌ Case 4: 중괄호로 감쌌지만 빈 문자열 */}
      <html lang="ko">
        <head>
          <title>Brace Empty</title>
        </head>
        <body>
          <p>lang 속성이 {"{''}"}로 비어 있습니다.</p>
        </body>
      </html>

      {/* ❌ Case 5: 중괄호로 공백만 */}
      <html lang={"   "}>
        <head>
          <title>Brace Whitespace</title>
        </head>
        <body>
          <p>lang 속성이 {"{'   '}"}로 공백뿐입니다.</p>
        </body>
      </html>

      {/* ❌ Case 6: 잘못된 값 (표준이 아닌 값) */}
      <html lang="xx-invalid">
        <head>
          <title>Invalid lang code</title>
        </head>
        <body>
          <p>lang 속성이 잘못된 코드입니다.</p>
        </body>
      </html>
    </>
  );
}
