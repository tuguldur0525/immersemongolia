import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
  Preview,
  Tailwind,
} from '@react-email/components'

interface WelcomeEmailProps {
  firstName: string
  email: string
}

export function WelcomeEmail({ firstName, email }: WelcomeEmailProps) {
  return (
    <Html lang="mn">
      <Head />
      <Preview>Immerse Mongolia-д тавтай морил, {firstName}!</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-xl">
            <Section className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-2xl p-8 text-center mb-6">
              <Text className="text-white text-2xl font-bold mb-1">Immerse Mongolia</Text>
              <Text className="text-blue-100 text-sm m-0">Монголын Бизнес Нээлтийн Платформ</Text>
            </Section>

            <Section className="bg-white rounded-2xl p-8 shadow-sm mb-6">
              <Heading className="text-gray-900 text-2xl font-bold mb-2">
                Тавтай морил, {firstName}!
              </Heading>
              <Text className="text-gray-600 leading-relaxed">
                Immerse Mongolia платформд амжилттай бүртгүүллээ.
              </Text>
              <Hr className="my-6 border-gray-100" />
              <Section className="text-center mt-8">
                <Button
                  href="https://immersemongolia.mn"
                  className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl text-sm"
                >
                  Immerse Mongolia нээх
                </Button>
              </Section>
            </Section>

            <Section className="text-center">
              <Text className="text-gray-400 text-xs">
                Та {email} хаягаар бүртгүүлсэн байна.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
