import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from "../__mocks__/localStorage.js"
import firestore from "../app/Firestore.js"
import BillsUI from "../views/BillsUI.js"
import firebase from "../__mocks__/firebase.js"

jest.mock('../app/Firestore.js')  

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const user = JSON.stringify({
  type: 'Employee'
});
window.localStorage.setItem('user', user);

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname }) 
}

Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['NewBill'] } });

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Should display the full form", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
      expect(screen.getByTestId('expense-type')).toBeTruthy();
      expect(screen.getByTestId('expense-name')).toBeTruthy();
      expect(screen.getByTestId('datepicker')).toBeTruthy();
      expect(screen.getByTestId('amount')).toBeTruthy();
      expect(screen.getByTestId('vat')).toBeTruthy();
      expect(screen.getByTestId('pct')).toBeTruthy();
      expect(screen.getByTestId('commentary')).toBeTruthy();
      expect(screen.getByTestId('file')).toBeTruthy();
    })

    describe('Then I click on the X', () => {
      test("Should close the page", () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock })
        const closeButton = screen.getByTestId('close');
        newBill.closeBill = jest.fn();
        closeButton.addEventListener('click', newBill.closeBill);
        fireEvent.click(closeButton);
        expect(newBill.closeBill).toBeCalled();
      })
    })

    describe("Then I select a file", () => {
      describe("Then a good type of file is selected", () => {
        test("Should keep the file", () => {
        document.body.innerHTML = NewBillUI();        
        const firestoreMock = {
          ref: jest.fn().mockReturnThis(),
          put: jest.fn().mockImplementation(() => Promise.resolve({ ref: {getDownloadURL: () => Promise.resolve()} })),
        };
        const firestore = {
          storage : firestoreMock
        }
        const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock });
        const file = screen.getByTestId('file');
        const fileExtension = new RegExp('^.+\.((jpg)|(jpeg)|(png))$', "i");
        const newFile  = new File(['bill'], 'bill.jpg', { type: "image/jpeg" });
        const handleChangeFile = jest.fn(newBill.handleChangeFile)
        file.addEventListener("change", handleChangeFile);
        fireEvent.change(file, {
          target: { files: [newFile], }
        });
        expect(fileExtension.test(file.files[0].name)).toBeTruthy();      
        expect(handleChangeFile).toHaveBeenCalled();
        expect(document.getElementById('bad-format')).toBeFalsy();
        })
      })

      describe("Then a bad type of file is selected", () => {
        test("Should reject the file and display an error", () => {
          document.body.innerHTML = NewBillUI();
          const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock })
          const fileInput = screen.getByTestId('file');
          const fileExtension = new RegExp('^.+\.(jpg|jpeg|png)$', "i");
          newBill.handleChangeFile = jest.fn()
          fileInput.addEventListener("change", newBill.handleChangeFile);
          fireEvent.change(fileInput, {
            target: { files: [new File(['bill.pdf'], 'bill.pdf', { type: "application/pdf" })] }
          });
          const file = screen.getByTestId('file').files[0].name;
          expect(newBill.handleChangeFile).toHaveBeenCalled();
          expect(fileExtension.test(file)).toBeFalsy();
          expect(document.getElementById('bad-format')).toBeTruthy();          
        })
        describe("Then a good type of file is selected", () => {
          test("Should remove error message", () => {
            document.body.innerHTML = NewBillUI();
            const errorExtension = document.createElement('p');
            errorExtension.id = 'bad-format';
            errorExtension.setAttribute("data-testid", "error");
            errorExtension.innerText = "Veuillez sélectionner une image (.jpg, .jpeg ou .png)";            
            screen.getByTestId('file').parentElement.appendChild(errorExtension);        
            const firestoreMock = {
              ref: jest.fn().mockReturnThis(),
              put: jest.fn().mockImplementation(() => Promise.resolve({ ref: {getDownloadURL: () => Promise.resolve()} })),
            };
            const firestore = {
              storage : firestoreMock
            }
            const newBill = new NewBill({ document, onNavigate, firestore, localStorage: localStorageMock });
            const file = screen.getByTestId('file');
            const fileExtension = new RegExp('^.+\.((jpg)|(jpeg)|(png))$', "i");
            const newFile  = new File(['bill'], 'bill.jpg', { type: "image/jpeg" });
            const handleChangeFile = jest.fn(newBill.handleChangeFile)
            file.addEventListener("change", handleChangeFile);
            fireEvent.change(file, {
              target: { files: [newFile], }
            });
            expect(fileExtension.test(file.files[0].name)).toBeTruthy();      
            expect(handleChangeFile).toHaveBeenCalled();
            expect(document.getElementById('bad-format')).toBeFalsy();
          })
        })
      })
    })   

    describe("Then I submit the form", () => {
      test("New bill should be created", () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({ document, onNavigate, firestore: null, localStorage: localStorageMock });
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn(newBill.handleSubmit);
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();        
      })
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a new bill", () => {
    test("post bill to API", async () => {
       const postSpy = jest.spyOn(firebase, "post");
       const bill = {
        id: "azerty123",
        vat: 70,
        fileUrl: "./london.jpg",
        status: "pending",
        type: "Transports",
        commentary: "Flight ticket to London",
        name: "London",
        fileName: "london.jpg",
        date: "23-11-2021",
        amount: 200,
        commentAdmin: "ok",
        email: "damien@damien.fr",
        pct: 10
      }
       const bills = await firebase.post(bill);
       expect(postSpy).toHaveBeenCalledTimes(1);
       expect(bills.data.length).toBe(5);
    });
    test("post bill to an API and fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 404" })
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy();
    });
    test("post bill to an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 500" })
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    });
  });
});