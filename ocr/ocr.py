from easyocr import Reader
# from pytesseract import image_to_string
import cv2

def cleanup_text(text):
    return "".join([c if ord(c) < 128 else "" for c in text]).strip()

reader = Reader(["en"], gpu=True)

cap = cv2.VideoCapture(2)

minuteCrop = ((100, 250), (350, 475))
secondCrop = ((100, 250), (500, 625))

while(True):
    ret, frame = cap.read()

    frame = cv2.resize(frame, (int(frame.shape[1] * 1.5), frame.shape[0]))

    blur = cv2.GaussianBlur(frame, (0, 0), 4)
    sharpened = cv2.addWeighted(frame, 1.5, blur, -1.1, 0)
    contrasted = cv2.addWeighted(sharpened, 4, sharpened, 0, -127)
    contrasted = cv2.cvtColor(contrasted, cv2.COLOR_BGR2GRAY)

    minutes = contrasted[minuteCrop[0][0]:minuteCrop[0][1], minuteCrop[1][0]:minuteCrop[1][1]]
    seconds = contrasted[secondCrop[0][0]:secondCrop[0][1], secondCrop[1][0]:secondCrop[1][1]]

    # minuteResults = image_to_string(minutes)
    # secondResults = image_to_string(seconds)

    # print(minuteResults, secondResults)

    minuteResults = reader.readtext(minutes, allowlist='0123456789')
    secondResults = reader.readtext(seconds, allowlist='0123456789')


    for (bbox, text, prob) in minuteResults:

        (tl, tr, br, bl) = bbox
        tl = (int(tl[0]) + minuteCrop[1][0], int(tl[1]) + minuteCrop[0][0])
        tr = (int(tr[0]) + minuteCrop[1][0], int(tr[1]) + minuteCrop[0][0])
        bl = (int(bl[0]) + minuteCrop[1][0], int(bl[1]) + minuteCrop[0][0])
        br = (int(br[0]) + minuteCrop[1][0], int(br[1]) + minuteCrop[0][0])

        text = cleanup_text(text) + " ({:4f})".format(prob)
        cv2.rectangle(frame, tl, br, (0, 255, 0), 2)
        cv2.putText(frame, text, (tl[0], tl[1] - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    for (bbox, text, prob) in secondResults:

        (tl, tr, br, bl) = bbox
        tl = (int(tl[0]) + secondCrop[1][0], int(tl[1]) + secondCrop[0][0])
        tr = (int(tr[0]) + secondCrop[1][0], int(tr[1]) + secondCrop[0][0])
        bl = (int(bl[0]) + secondCrop[1][0], int(bl[1]) + secondCrop[0][0])
        br = (int(br[0]) + secondCrop[1][0], int(br[1]) + secondCrop[0][0])

        text = cleanup_text(text) + " ({:4f})".format(prob)
        cv2.rectangle(frame, tl, br, (0, 255, 0), 2)
        cv2.putText(frame, text, (tl[0], tl[1] - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    cv2.imshow("Video", frame)
    cv2.imshow("Sharpened", sharpened)
    cv2.imshow("Contrast", contrasted)
    cv2.imshow("Minutes", minutes)
    cv2.imshow("Seconds", seconds)
    if len(minuteResults) > 0 and len(secondResults) > 0:
        print(minuteResults[0][1], secondResults[0][1])
    else:
        print()

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()

cv2.destroyAllWindows()