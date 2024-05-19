import re

class Rotor(object):
    def __init__(self, wiring, notch=None, offset=0, ringOffset=0):
        self._ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        self.wiring = wiring
        self.notch = notch
        self.offset = offset
        self.ringOffset = ringOffset

    def translate(self, s, previousOffset=0):
        out = []
        for char in s:
            out.append(
                self.wiring[(self._ALPHABET.index(char)
                            + self.offset
                            + self.ringOffset
                            - previousOffset) % 26]
            )

        return ''.join(out)

    def reverse_translate(self, s, previousOffset=0):
        out = []
        for char in s:
            c = self._ALPHABET[(self._ALPHABET.index(char)
                               + self.offset
                               + self.ringOffset
                               - previousOffset) % 26]
            out.append(
                self._ALPHABET[self.wiring.index(c)]
            )

        return ''.join(out)


class Enigma(object):
    def __init__(self, r1, r2, r3, reflector):
        self.r1 = r1
        self.r2 = r2
        self.r3 = r3
        self.reflector = reflector
        self._STATIC_ROTOR = Rotor(r1._ALPHABET)

    def translate(self, message):
        out = []
        sanitized_message = re.sub('[^a-zA-Z]', '',  message).upper()
        for char in sanitized_message:
            self.r3.offset = (self.r3.offset + 1) % 26
            if self.r3.offset == 22:
                pass
            c = self.r3.translate(char)

            if r3._ALPHABET[self.r3.offset] == self.r3.notch:
                r2.offset = (self.r2.offset + 1) % 26
            c = self.r2.translate(c, self.r3.offset)

            if r2._ALPHABET[self.r2.offset] == self.r2.notch:
                r1.offset = (self.r1.offset + 1) % 26
            c = self.r1.translate(c, self.r2.offset)

            c = self.reflector.translate(c)

            c = self.r1.reverse_translate(c)
            c = self.r2.reverse_translate(c, self.r1.offset)
            c = self.r3.reverse_translate(c, self.r2.offset)
            out.append(self._STATIC_ROTOR.translate(c, r3.offset))

        return ''.join(out)

# br1 = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'
# r1 = str.maketrans(alphabet, br1)
# r1_rev = str.maketrans(br1, alphabet)

# br2 = 'AJDKSIRUXBLHWTMCQGZNPYFVOE'
# r2 = str.maketrans(alphabet, br2)
# r2_rev = str.maketrans(br2, alphabet)

# br3 = offset('BDFHJLCPRTXVZNYEIWGAKMUSQO', 1)
# #br3 = 'BDFHJLCPRTXVZNYEIWGAKMUSQO'
# r3 = str.maketrans(alphabet, br3)
# r3_rev = str.maketrans(br3, alphabet)

# reflectorb = str.maketrans(alphabet, 'YRUHQSLDPXNGOKMIEBFZCWVJAT')


r3 = Rotor('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'W')
r2 = Rotor('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'F')
r1 = Rotor('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'R')

reflectorb = Rotor('YRUHQSLDPXNGOKMIEBFZCWVJAT')

e = Enigma(r1, r2, r3, reflectorb)

# m = e.translate('Hello. I am the best and stuff, so yeah.')
m = e.translate('ILBDALCNHNNFLNUCMMRSTCDPRLXHR')

print(m)

# e = Enigma(enigma.r1, enigma.r2, enigma.r3, enigma.reflectorb)
