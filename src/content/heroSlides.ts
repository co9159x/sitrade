/**
 * Local hero photographs. Each file was downloaded from Unsplash and is used
 * under the Unsplash License (https://unsplash.com/license), which allows
 * commercial and portfolio use without a required credit.
 * Photo ids, in slide order:
 * 1631603090989-93f9ef6f9d80, 1518546305927-5a555bb7020d,
 * 1605792657660-596af9009e82, 1642790106117-e829e14a795f,
 * 1640340434855-6084b1f4901c, 1590283603385-17ffb3a7f29f,
 * 1621761191319-c6fb62004040, 1622630998477-20aa696ecb05,
 * 1634704784915-aacf363b021f, 1516245834210-c4c142787335,
 * 1611974789855-9c2a0a7236a3, 1642104704074-907c0698cbd9.
 */
export type HeroSlide = {
  image: string
  alt: string
  title: string
  fallback: string
}

export const heroSlides: HeroSlide[] = [
  {
    image: '/hero/01.jpg',
    alt: 'Physical Bitcoin, Ethereum, and Dogecoin tokens piled on a dark surface',
    title: 'Crypto coins',
    fallback: 'from-[#12182a] via-[#243056] to-[#070910]',
  },
  {
    image: '/hero/02.jpg',
    alt: 'A bitcoin coin in front of a blurred market chart on a dark screen',
    title: 'Market screens',
    fallback: 'from-[#10182c] via-[#1c2744] to-[#070910]',
  },
  {
    image: '/hero/03.jpg',
    alt: 'Bitcoin and Ethereum coins in front of a candlestick chart',
    title: 'BTC and ETH',
    fallback: 'from-[#101828] via-[#1a2740] to-[#070910]',
  },
  {
    image: '/hero/04.jpg',
    alt: 'A laptop, phone, and watch showing buy and sell trading charts',
    title: 'Trading desk',
    fallback: 'from-[#0c1220] via-[#18243c] to-[#070910]',
  },
  {
    image: '/hero/05.jpg',
    alt: 'A dark candlestick chart with green and red price bars',
    title: 'Candlestick chart',
    fallback: 'from-[#101820] via-[#163040] to-[#070910]',
  },
  {
    image: '/hero/06.jpg',
    alt: 'A Bitcoin versus US dollar candlestick chart on a trading screen',
    title: 'BTCUSD',
    fallback: 'from-[#07140f] via-[#0e241c] to-[#070910]',
  },
  {
    image: '/hero/07.jpg',
    alt: 'A phone showing Bitcoin and Ethereum market rows with price charts',
    title: 'Mobile markets',
    fallback: 'from-[#071018] via-[#102033] to-[#070910]',
  },
  {
    image: '/hero/08.jpg',
    alt: 'A physical bitcoin resting on a laptop keyboard',
    title: 'Bitcoin',
    fallback: 'from-[#10141c] via-[#1a2430] to-[#070910]',
  },
  {
    image: '/hero/09.jpg',
    alt: 'A hand holding a bitcoin in front of a price chart on a monitor',
    title: 'Price chart',
    fallback: 'from-[#0c1016] via-[#161c28] to-[#070910]',
  },
  {
    image: '/hero/10.jpg',
    alt: 'A bitcoin coin standing in front of colourful market screens',
    title: 'Trading desk',
    fallback: 'from-[#141018] via-[#241c38] to-[#070910]',
  },
  {
    image: '/hero/11.jpg',
    alt: 'Red and green candlesticks with moving averages on a black chart',
    title: 'Price action',
    fallback: 'from-[#120c16] via-[#241424] to-[#070910]',
  },
  {
    image: '/hero/12.jpg',
    alt: 'The Ethereum diamond mark on a dark gradient',
    title: 'Ethereum',
    fallback: 'from-[#10102a] via-[#1a1848] to-[#070910]',
  },
]
