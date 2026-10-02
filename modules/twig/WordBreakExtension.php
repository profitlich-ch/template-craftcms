<?php

namespace modules\twig;

use craft\helpers\Html;
use Twig\Extension\AbstractExtension;
use Twig\Markup;
use Twig\TwigFilter;

/**
 * Lets editors control line breaks with two plain-text markers.
 *
 * Two hyphens become a soft hyphen — the line may break there. Two
 * underscores become a non-breaking space — the line must not break there:
 *
 *     Planungs--methoden   →  Planungs­methoden
 *     Monster__AG          →  Monster AG
 *
 * Both characters are invisible, which is exactly why the markers stay in the
 * field and are only expanded on output. An invisible character stored in the
 * field can neither be found nor deliberately removed; a `--` can.
 *
 * Doing it on output rather than in the editor also avoids two traps of
 * CKEditor's `typing.transformations`: it only fires while typing, so pasted
 * text stays untouched, and a `--` rule compiles to `/(--)$/`, which strikes
 * on the second hyphen and thereby disables the built-in en dash rule
 * `/(^| )(--)( )$/`.
 *
 * This filter deliberately leaves quotes, dashes and ellipses alone — those
 * belong to the editor's own typography rules.
 *
 * Register the extension from a module:
 *
 *     Craft::$app->getView()->registerTwigExtension(new WordBreakExtension());
 *
 * Then apply it wherever a text field is rendered:
 *
 *     {{ block.bodyText|wordBreaks }}
 *     {{ project.city|wordBreaks }}
 *
 * Note that the filter has to be applied at every output site. There is no
 * global hook for it, so a small guard script that walks the templates and
 * reports missing calls pays for itself quickly.
 */
class WordBreakExtension extends AbstractExtension
{
    /**
     * Marker → character.
     *
     * Written as escape sequences on purpose: both characters are invisible,
     * and a literal one in the source would be impossible to review.
     */
    private const MARKERS = [
        '--' => "\u{00AD}", // soft hyphen — a break is allowed here
        '__' => "\u{00A0}", // non-breaking space — no break here
    ];

    public function getFilters(): array
    {
        return [
            new TwigFilter('wordBreaks', [$this, 'wordBreaks'], ['is_safe' => ['html']]),
        ];
    }

    /**
     * @param mixed $value Field value; Markup is treated as HTML, anything
     *                     else as plain text
     */
    public function wordBreaks(mixed $value): Markup
    {
        if ($value === null) {
            return new Markup('', 'UTF-8');
        }

        if ($value instanceof Markup) {
            return new Markup($this->inHtml((string)$value), 'UTF-8');
        }

        // Single-line field: encode first, otherwise a `<` in the text would
        // be mistaken for a tag in the next step
        return new Markup($this->replace(Html::encode((string)$value)), 'UTF-8');
    }

    /**
     * Replaces outside of tags only.
     *
     * Without that separation the replacement would also hit a `--` inside a
     * URL or a comment, leaving a broken link behind.
     */
    private function inHtml(string $html): string
    {
        $parts = preg_split('/(<[^>]*>)/', $html, -1, PREG_SPLIT_DELIM_CAPTURE);

        foreach ($parts as $i => $part) {
            // The captured tags sit at the odd positions
            if ($i % 2 === 0) {
                $parts[$i] = $this->replace($part);
            }
        }

        return implode('', $parts);
    }

    private function replace(string $text): string
    {
        return str_replace(array_keys(self::MARKERS), array_values(self::MARKERS), $text);
    }
}
