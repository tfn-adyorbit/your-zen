import re
import unicodedata

class SmartTfnEngine:
    @staticmethod
    def extract_digits(input_str: str) -> str:
        """Extract only digit characters from string."""
        if not input_str:
            return ""
        return re.sub(r'\D', '', input_str)

    @classmethod
    def format_to_competitor_pattern(cls, competitor_str: str, target_input_str: str) -> str:
        """
        Maps target digits/country code onto competitor's exact formatting template.
        Intelligently separates country codes (+1, +52, +44, +54, etc.) so CC digits
        don't get crammed into competitor body slots.
        """
        if not competitor_str or not target_input_str:
            return competitor_str or ""

        clean_comp = competitor_str.strip()
        clean_target = target_input_str.strip()

        comp_has_plus = clean_comp.startswith('+')
        target_has_plus = clean_target.startswith('+')

        if comp_has_plus or target_has_plus:
            comp_cc_len = 0
            comp_body_str = clean_comp

            if comp_has_plus:
                comp_digits = cls.extract_digits(clean_comp)
                if clean_comp.startswith('+1'):
                    comp_cc_len = 1
                else:
                    cc3 = comp_digits[:3]
                    known_3digit = {'351', '380', '971', '506', '502', '503', '504', '505', '507', '591', '592', '593', '595', '598'}
                    comp_cc_len = 3 if cc3 in known_3digit else 2

                digits_seen = 0
                cc_end_idx = 0
                for i, ch in enumerate(clean_comp):
                    if unicodedata.normalize('NFKC', ch).isdigit():
                        digits_seen += 1
                        if digits_seen == comp_cc_len:
                            cc_end_idx = i + 1
                            break
                comp_body_str = clean_comp[cc_end_idx:]

            target_digits = cls.extract_digits(clean_target)
            target_cc_str = ""
            target_body_digits = target_digits

            if target_has_plus:
                if clean_target.startswith('+1'):
                    target_cc_len = 1
                else:
                    cc3 = target_digits[:3]
                    known_3digit = {'351', '380', '971', '506', '502', '503', '504', '505', '507', '591', '592', '593', '595', '598'}
                    target_cc_len = 3 if cc3 in known_3digit else 2
                target_cc_str = '+' + target_digits[:target_cc_len]
                target_body_digits = target_digits[target_cc_len:]
            elif comp_has_plus:
                if len(target_digits) > 10:
                    user_cc_len = len(target_digits) - 10
                    target_cc_str = '+' + target_digits[:user_cc_len]
                    target_body_digits = target_digits[user_cc_len:]
                else:
                    comp_digits = cls.extract_digits(clean_comp)
                    target_cc_str = '+' + comp_digits[:comp_cc_len or 1]
                    target_body_digits = target_digits

            result_body = []
            b_idx = 0
            for ch in comp_body_str:
                normalized = unicodedata.normalize('NFKC', ch)
                if normalized.isdigit():
                    if b_idx < len(target_body_digits):
                        result_body.append(target_body_digits[b_idx])
                        b_idx += 1
                else:
                    result_body.append(ch)

            while b_idx < len(target_body_digits):
                result_body.append(target_body_digits[b_idx])
                b_idx += 1

            return target_cc_str + "".join(result_body)

        target_digits = cls.extract_digits(clean_target)
        if not target_digits:
            return competitor_str

        result = []
        target_idx = 0
        for char in competitor_str:
            normalized = unicodedata.normalize('NFKC', char)
            if normalized.isdigit():
                if target_idx < len(target_digits):
                    result.append(target_digits[target_idx])
                    target_idx += 1
            else:
                result.append(char)

        while target_idx < len(target_digits):
            result.append(target_digits[target_idx])
            target_idx += 1

        return "".join(result)

    @classmethod
    def extract_all_tfns(cls, text: str) -> list:
        """
        Extracts all competitor phone numbers across various formats (+1, +52, +54, 1-855, (855), 855.830, etc.)
        Returns list of dicts with start, end, and text.
        """
        if not text:
            return []
        pattern = re.compile(
            r'(?:\+?\d{1,3}[^\w\n]{0,3})?(?:\(\s*\d{1,4}\s*\)|\d{1,4})[^\w\n]{0,3}\d{2,4}[^\w\n]{0,3}\d{2,4}(?:[^\w\n]{0,3}\d{1,5})?',
            re.UNICODE
        )
        matches = []
        for m in pattern.finditer(text):
            raw = m.group(0).strip('.,;: /-')
            digits = cls.extract_digits(raw)
            if 10 <= len(digits) <= 15:
                if ' / ' in raw:
                    parts = raw.split(' / ')
                    for p in parts:
                        d = cls.extract_digits(p)
                        if 10 <= len(d) <= 15:
                            p_clean = p.strip()
                            idx = m.start() + m.group(0).find(p)
                            matches.append({'start': idx, 'end': idx + len(p_clean), 'text': p_clean})
                else:
                    matches.append({'start': m.start(), 'end': m.end(), 'text': raw})
        return matches

    @classmethod
    def replace_text_alternating(cls, text: str, target_lines: list) -> tuple:
        """
        Scans text for phone numbers using universal detection and replaces them in round-robin alternating order.
        Returns (new_text, count_replaced).
        """
        if not target_lines:
            return text, 0

        matches = cls.extract_all_tfns(text)
        if not matches:
            return text, 0

        result_pieces = []
        last_idx = 0
        occurrence_idx = 0

        for m in matches:
            start, end = m['start'], m['end']
            result_pieces.append(text[last_idx:start])

            competitor_number = m['text']
            target_input = target_lines[occurrence_idx % len(target_lines)]
            occurrence_idx += 1

            formatted_number = cls.format_to_competitor_pattern(competitor_number, target_input)
            result_pieces.append(formatted_number)

            last_idx = end

        result_pieces.append(text[last_idx:])
        return "".join(result_pieces), len(matches)
